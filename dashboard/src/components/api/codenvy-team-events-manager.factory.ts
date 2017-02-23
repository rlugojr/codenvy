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

enum TEAM_EVENTS {MEMBER_ADDED, MEMBER_REMOVED, ORGANIZATION_REMOVED, ORGANIZATION_RENAMED}


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

  /**
   * Subscribe team changing events.
   *
   * @param teamId team id to subscribe on events
   */
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
        case TEAM_EVENTS.MEMBER_REMOVED:
          this.processDeleteMember(message);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Unsubscribe team changing events.
   *
   * @param teamId
   */
  unSubscribeTeamNotifications(teamId: string) {
    let bus = this.cheWebsocket.getBus();
    bus.unsubscribe(this.TEAM_CHANNEL + teamId);
  }

  /**
   * Adds rename handler.
   *
   * @param handler rename handler function
   */
  addRenameHandler(handler: Function): void {
    this.renameHandlers.push(handler);
  }

  /**
   * Removes rename handler.
   *
   * @param handler handler to remove
   */
  removeRenameHandler(handler: Function): void {
    this.renameHandlers.splice(this.renameHandlers.indexOf(handler), 1);
  }

  /**
   * Adds delete handler.
   *
   * @param handler delete handler function
   */
  addDeleteHandler(handler: Function): void {
    this.deleteHandlers.push(handler);
  }

  /**
   * Removes delete handler.
   *
   * @param handler delete handler to remove
   */
  removeDeleteHandler(handler: Function): void {
    this.deleteHandlers.splice(this.deleteHandlers.indexOf(handler), 1);
  }

  /**
   * Process team renamed event.
   *
   * @param info
   */
  processRenameTeam(info: any): void {
    let isCurrentUser = this.isCurrentUser(info.performerName);
    if (isCurrentUser) {
      //TODO
    } else {
      let title = 'Team renamed';
      let content = 'Team \"' + info.oldName + '\" has been renamed to \"' + info.newName + '\" by ' + info.performerName;
      this.applicationNotifications.addInfoNotification(title, content);

      this.renameHandlers.forEach((handler: Function) => {
        handler(info);
      });
    }
  }

  /**
   * Process team deleted event.
   *
   * @param info
   */
  processDeleteTeam(info: any): void {
    let isCurrentUser = this.isCurrentUser(info.performerName);
    if (isCurrentUser) {
      //TODO
    } else {
      let title = 'Team deleted';
      let content = 'Team \"' + info.organization.qualifiedName + '\" has been deleted by ' + info.performerName;
      this.applicationNotifications.addInfoNotification(title, content);

      this.unSubscribeTeamNotifications(info.organization.id);

      this.deleteHandlers.forEach((handler: Function) => {
        handler(info);
      });
    }
  }

  /**
   * Process member deleted event.
   *
   * @param info
   */
  processDeleteMember(info: any): void {
    let isCurrentUserInitiator = this.isCurrentUser(info.performerName);
    let isCurrentUserDeleted = (info.removedUserId === this.codenvyUser.getUser().id);
    if (isCurrentUserInitiator) {
      //TODO
    } else {
      let title = isCurrentUserDeleted ? 'You have been removed from team' : 'Member have been removed from team';
      let content = isCurrentUserDeleted ? info.performerName + ' removed you from team called ' + '.'
        : info.performerName + ' removed member from team called ' + '.'; //TODO
      this.applicationNotifications.addInfoNotification(title, content);

      this.unSubscribeTeamNotifications(info.organization.id);

      this.deleteHandlers.forEach((handler: Function) => {
        handler(info);
      });
    }
  }

  /**
   * Checks current user is the performer of the action, that causes team changes.
   *
   * @param name
   * @returns {boolean}
   */
  isCurrentUser(name: string): boolean {
    return name === this.codenvyUser.getUser().name;
  }
}
