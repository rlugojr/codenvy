package main

/*
 * websocket/pty proxy server:
 * This program wires a websocket to a pty master.
 *
 * Usage:
 * go build -o ws-pty-proxy server.go
 * ./websocket-terminal -cmd /bin/bash -addr :9000 -static $HOME/src/websocket-terminal
 * ./websocket-terminal -cmd /bin/bash -- -i
 *
 * TODO:
 *  * make more things configurable
 *  * switch back to binary encoding after fixing term.js (see index.html)
 *  * make errors return proper codes to the web client
 *
 * Copyright 2014 Al Tobey tobert@gmail.com
 * MIT License, see the LICENSE file
 */

import (
	"flag"
	"github.com/akorneta/che-lib/websocket"
	"github.com/akorneta/che-lib/pty"
	"github.com/akorneta/che-lib/go-http-auth"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"encoding/json"
	"bufio"
	"bytes"
	"unicode/utf8"
	"encoding/xml"
	"io/ioutil"
)

const (
	// environment variable TERM=xterm
	// used as environment for executing commandFlag command
	DefaultTerm = "xterm"

	// default size of the pty
	DefaultTermRows = 60
	DefaultTermCols = 200

	// default buffer size for reading from pty file
	DefaultPtyBufferSize = 8192

	// Flag default values
	DefaultTerminalServerAddress = "localhost:9000"
	DefaultCommand               = "/bin/bash"

	// Base auth realm
	RealmMessage = "Restricted"
)

// The address to run this http server on.
// May be either "IP:PORT" or just ":PORT" default is ":9000".
// It is set by "addr" command line argument.
var addressFlag string

// The command to execute on slave side of the pty.
// The default value is "/bin/bash".
// It is set by "cmd" command line argument.
var commandFlag string

// The path to the static content.
// The default value is path to the current directory.
// It is set by "static" command line argument.
var staticContentPathFlag string

// The path to the file with user secrets.
// The default value is empty string because in сhe we don't need this feature.
// It is set by "realm" command line argument.
var realmFlag string

// In memory storage username to password.
// It is not thread safe.
var users map[string]string

type WsPty struct {
	// pty builds on os.exec
	command *exec.Cmd

	// a pty is simply an os.File
	ptyFile *os.File
}

// Describes tomcat-users.xml structure
type Realm struct {
	XMLName xml.Name `xml:"tomcat-users"`
	Users   []User   `xml:"user"`
}

// Describes user from tomcat-users.xml structure
type User struct {
	Name     string `xml:"name,attr"`
	Password string `xml:"password,attr"`
}

// Executes command + starts pty
// Command output is written to the certain file managed by pty.
func startPty() (wsPty *WsPty, err error) {
	// create command, from command flag and left arguments
	command := exec.Command(commandFlag, flag.Args()...)

	// set command environment
	osEnv := os.Environ()
	osEnv = append(osEnv, "TERM=" + DefaultTerm)
	command.Env = osEnv;

	// start pty
	ptyFile, err := pty.Start(command)
	if (err != nil) {
		return nil, err
	}

	// adjust pty
	pty.Setsize(ptyFile, DefaultTermRows, DefaultTermCols);

	return &WsPty{
		command,
		ptyFile,
	}, err
}

func (wp *WsPty) Stop() {
	wp.ptyFile.Close()
	wp.command.Wait()
}

// Sets websocket limitations
var upgrader = websocket.Upgrader {

	// Limits the size of the input message to the 1 byte
	ReadBufferSize:  1,

	// Limits the size of the output message to the 1 byte
	WriteBufferSize: 1,

	CheckOrigin: func(request *http.Request) bool {
		return true
	},
}

// Copy everything from the pty master to the websocket using UTF-8 encoding.
// This function contains forever cycle which may stop in the following reasons:
// * When any error occurs during reading from pty file
// * When any error occurs during runes reading(from pty buffer)
// * When any error occurs during writing to the websocket channel
func transferPtyFileContentToWebsocket(conn *websocket.Conn, ptyFile *os.File) {
	// buffer which keeps ptyFile bytes
	ptyBuf        := make([]byte, DefaultPtyBufferSize)
	ptyFileReader := bufio.NewReader(ptyFile)
	tmpBuf        := new(bytes.Buffer)
	// TODO: more graceful exit on socket close / process exit
	for {
		ptyBytesRead, err := ptyFileReader.Read(ptyBuf)
		if err != nil {
			log.Printf("Failed to read from pty master: %s", err)
			return
		}
		runeReader := bufio.NewReader(bytes.NewReader(append(tmpBuf.Bytes()[:], ptyBuf[:ptyBytesRead]...)))
		tmpBuf.Reset()
		// read byte array as Unicode code points (rune in go)
		// runes explained https://blog.golang.org/strings
		i := 0;
		for i < ptyBytesRead {
			runeChar, runeLen, err := runeReader.ReadRune()
			if err != nil {
				log.Printf("Failed to read rune from the pty rune buffer: %s", err)
				return
			}
			if runeChar == utf8.RuneError {
				runeReader.UnreadRune()
				break
			}
			tmpBuf.WriteRune(runeChar)
			i += runeLen
		}
		// At this point of time tmp buffer may contain [0, bytesRead) bytes
		// which are going to be written into the websocket channel
		err = conn.WriteMessage(websocket.TextMessage, tmpBuf.Bytes())
		if err != nil {
			log.Printf("Failed to write UTF-8 character to the webscoket channel: %s", err)
			return
		}
		// appending all bytes which were not processed from the pty buffer
		// to the tmp buffer that allows to read runes in the next iteration
		tmpBuf.Reset();
		if i < ptyBytesRead {
			tmpBuf.Write(ptyBuf[i:ptyBytesRead])
		}
	}
}

// delegates #ptyHandler
func ptyAuthHandler(httpWriter http.ResponseWriter, authRequest *auth.AuthenticatedRequest) {
	ptyHandler(httpWriter, &authRequest.Request)
}

// Handles /pty requests, starts os process and transfers its output
// to the dedicated websocket channel
func ptyHandler(httpWriter http.ResponseWriter, request *http.Request) {
	conn, err := upgrader.Upgrade(httpWriter, request, nil)
	if err != nil {
		log.Printf("Websocket upgrade failed: %s\n", err)
		return
	}
	defer conn.Close()

	wsPty, err := startPty()
	if err != nil {
		httpWriter.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer wsPty.Stop()

	go transferPtyFileContentToWebsocket(conn, wsPty.ptyFile)

	type Message struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}

	// read from the web socket, copying to the pty master
	// messages are expected to be text
	for {
		mt, payload, err := conn.ReadMessage()
		if err != nil && err != io.EOF {
			log.Printf("conn.ReadMessage failed: %s\n", err)
			return
		}
		var msg Message;
		switch mt {
		case websocket.BinaryMessage:
			log.Printf("Ignoring binary message: %q\n", payload)
		case websocket.TextMessage:
			err := json.Unmarshal(payload, &msg)
			if err != nil {
				log.Printf("Invalid message %s\n", err);
				continue
			}
			switch msg.Type {
			case "resize" :
				var size []float64;
				err := json.Unmarshal(msg.Data, &size)
				if err != nil {
					log.Printf("Invalid resize message: %s\n", err)
				} else {
					pty.Setsize(wsPty.ptyFile, uint16(size[1]), uint16(size[0]));
				}
			case "data" :
				var dat string
				err := json.Unmarshal(msg.Data, &dat)
				if err != nil {
					log.Printf("Invalid data message %s\n", err)
				} else {
					wsPty.ptyFile.Write([]byte(dat))
				}
			default:
				log.Printf("Invalid message type %d\n", mt)
				return
			}

		default:
			log.Printf("Invalid message type %d\n", mt)
			return
		}
	}
}

func init() {
	cwd, _ := os.Getwd()
	flag.StringVar(&addressFlag,           "addr",   DefaultTerminalServerAddress, "IP:PORT or :PORT address to listen on")
	flag.StringVar(&commandFlag,           "cmd",    DefaultCommand,               "command to execute on slave side of the pty")
	flag.StringVar(&staticContentPathFlag, "static", cwd,                          "path to static content")
	flag.StringVar(&realmFlag,             "realm",  "",                           "Path to file with user info")
	// TODO: make sure paths exist and have correct permissions
}

func secret(user, realm string) string {
	secret := users[user];
	if len(secret) > 0 {
		return secret
	} else {
		return ""
	}
}

func loadSecrets(filePath string) {
	if users == nil {
		users = make(map[string]string)
	}
	realm := Realm{}
	xmlContent, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Printf("Failed read from file %s : %s\n", filePath, err)
	}
	err = xml.Unmarshal(xmlContent, &realm)
	if err != nil {
		log.Printf("Failde during parsing %s : %s\n", filePath, err)
	}
	for _, user := range realm.Users {
		users[user.Name] = user.Password
	}
}

func main() {
	flag.Parse()
	if realmFlag != "" {
		loadSecrets(realmFlag)
		// http request wrapper that checks basic auth header for each handshake request
		authenticator := auth.NewBasicAuthenticator(RealmMessage, secret)
		http.HandleFunc("/pty", authenticator.Wrap(ptyAuthHandler))
	}else {
		// in che we do not have authentication on the ws-terminal,  so we don't need wrap http request handler
		http.HandleFunc("/pty", ptyHandler)
	}

	// serve html & javascript
	http.Handle("/", http.FileServer(http.Dir(staticContentPathFlag)))

	err := http.ListenAndServe(addressFlag, nil)
	if err != nil {
		log.Fatalf("net.http could not listen on address '%s': %s\n", addressFlag, err)
	}
}
