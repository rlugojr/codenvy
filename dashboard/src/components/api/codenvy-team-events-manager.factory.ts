/*
 *  [2015] - [2017] Codenvy, S.A.
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Codenvy S.A. and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Codenvy S.A.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Codenvy S.A..
 */
'use strict';
import {CodenvyUser} from './codenvy-user.factory';

enum TEAM_EVENTS {ORGANIZATION_MEMBER_ADDED, ORGANIZATION_MEMBER_REMOVED, ORGANIZATION_REMOVED, ORGANIZATION_RENAMED}


/**
 * This class is handling the notifications per each team.
 *
 * @author Ann Shumilova
 */
export class CodenvyTeamEventsManager {
  codenvyUser: CodenvyUser;
  $log: ng.ILogService;
  cheWebsocket: any;
  applicationNotifications: any;
  TEAM_CHANNEL: string = 'organization:';
  subscribers: Array<string>;
  renameHandlers: Array<Function>;
  deleteHandlers: Array<Function>;

  /**
   * Default constructor that is using resource
   * @ngInject for Dependency injection
   */
  constructor(cheWebsocket: any, applicationNotifications: any, $log, codenvyUser: CodenvyUser) {
    this.codenvyUser = codenvyUser;
    this.cheWebsocket = cheWebsocket;
    this.applicationNotifications = applicationNotifications;
    this.$log = $log;
    this.subscribers = [];
    this.renameHandlers = [];
    this.deleteHandlers = [];
  }

  subscribeTeamNotifications(teamId: string) {
    if (this.subscribers.indexOf(teamId) >= 0) {
      return;
    }
    this.subscribers.push(teamId);
    let bus = this.cheWebsocket.getBus();
    bus.subscribe(this.TEAM_CHANNEL + teamId, (message: any) => {
      switch (TEAM_EVENTS[message.type]) {
        case TEAM_EVENTS.ORGANIZATION_RENAMED:
          this.processRenameTeam(message);
          break;
        case TEAM_EVENTS.ORGANIZATION_REMOVED:
          this.processDeleteTeam(message);
          break;
        default:
          break;
      }
      console.log(message);
    });
  }

  addRenameHandler(handler: Function): void {
    this.renameHandlers.push(handler);
  }

  addDeleteHandler(handler: Function): void {
    this.deleteHandlers.push(handler);
  }

  processRenameTeam(info: any): void {
    let isCurrentUser = this.isCurrentUser(info.performerName);
    if (isCurrentUser) {
      //TODO
    } else {
      let title = 'Team renamed'
      let content = 'Team \"' + info.oldName + '\" has been renamed to \"' + info.newName + '\" by ' + info.performerName;
      this.applicationNotifications.addInfoNotification(title, content);

      this.renameHandlers.forEach((handler: Function) => {
        handler();
      });
    }
  }

  processDeleteTeam(info: any): void {
    let isCurrentUser = this.isCurrentUser(info.performerName);
    if (isCurrentUser) {
      //TODO
    } else {
      let title = 'Team deleted'
      let content = 'Team \"' + info.organization.qualifiedName + '\" has been deleted by ' + info.performerName;
      this.applicationNotifications.addInfoNotification(title, content);

      this.deleteHandlers.forEach((handler: Function) => {
        handler();
      });
    }
  }

  processDeleteMember(info: any): void {

  }

  isCurrentUser(name: string): boolean {
    return name === this.codenvyUser.getUser().name;
  }

  unSubscribeTeamNotifications(teamId: string) {
   /* let bus = this.cheWebsocket.getBus();
    bus.subscribe(this.TEAM_CHANNEL + teamId, (message: any) => {
      console.log(message);
      this.applicationNotifications.addInfoNotification("Team Renamed", "Team Renamed");
    });*/
  }
}
