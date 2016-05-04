/*
 *  [2015] - [2016] Codenvy, S.A.
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

import {CodenvyNavbarConfig} from './navbar/navbar-config';
import {CodenvyAccountConfig} from './account/account-config';
import {Register} from './utils/register';
import {CodenvyComponentsConfig} from '../components/components-config';
import {FactoryConfig} from './factories/factories-config';

import {LoginCtrl} from './login/login.controller';

import {AdminConfig} from './admin/admin-config';
import {CodenvyOnpremConfig} from './onprem/onprem-config';

let initModule = angular.module('codenvyDashboard', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'braintree-angular', 'gavruk.card',
  'ngResource', 'ngRoute', 'ngPasswordStrength', 'ui.codemirror', 'ui.gravatar', 'userDashboard', 'ngMessages']);


// Development mode is set to TRUE
// the build assembly (pom.xml) will replace this mode by false when building the application
// so distribution will have development mode turned off
var DEV = true;

// and setup controllers
initModule.controller('LoginCtrl', LoginCtrl);


// config routes
initModule.config(['$routeProvider', ($routeProvider) => {
  $routeProvider
    .accessWhen('/login', {
      templateUrl: 'app/login/login.html',
      controller: 'LoginCtrl',
      controllerAs: 'loginCtrl'
    })
    .accessOtherWise({
      redirectTo: '/projects'
    });

}]);

//add tasks to run
initModule.run(['$rootScope', 'nagMessageService', 'cheUIElementsInjectorService',
  ($rootScope, nagMessageService, cheUIElementsInjectorService) => {
    $rootScope.$on('$viewContentLoaded', () => {
      nagMessageService.createLicenseMessage();
      cheUIElementsInjectorService.addElementForInjection('dashboardPageContent', 'recentFactories', '<cdvy-last-factories></cdvy-last-factories>');
    });
}]);

// add interceptors
initModule.factory('AuthInterceptor', ($window, $cookies, $q, $location, $log) => {
  return {
    request: (config) => {
      //remove prefix url
      if (config.url.indexOf('https://codenvy.com/api') === 0) {
        config.url = config.url.substring('https://codenvy.com'.length);
      }

      //Do not add token on auth login
      if (config.url.indexOf('/api/auth/login') === -1 && config.url.indexOf('api/') !== -1 && $window.sessionStorage['codenvyToken']) {
        config.params = config.params || {};
        angular.extend(config.params, {token: $window.sessionStorage['codenvyToken']});
      }
      return config || $q.when(config);
    },
    response: (response) => {
      return response || $q.when(response);
    },
    responseError: (rejection) => {
      // handle only api call
      if (rejection.config) {
        if (rejection.config.url.indexOf('localhost') > 0 || rejection.config.url.startsWith('/api/user') > 0) {
          if (rejection.status === 401 || rejection.status === 403) {
            $log.info('Redirect to login page.');
            $location.path('/login');

          }
        }
      }
      return $q.reject(rejection);
    }
  };
});

initModule.factory('AddMachineTokenToUrlInterceptor', ($injector, $q) => {
  var tokens = {};
  function requestToken(workspaceId) {
    return $injector.get('$http').get('/api/machine/token/' + workspaceId)
                    .then((resp) => tokens[workspaceId] = resp.data.machineToken);
  }

  function getWorkspaceId(url) {
    // examples:
    // ws-agent-host/wsagent/api/ext/project/:workspaceId/import/:path
    // ws-agent-host/wsagent/api/ext/project-type/:workspaceId
    // ws-agent-host/wsagent/api/ext/git/:workspaceId/read-only-url?projectPath=:path'
    var groups = /.+\/ext\/(project|project-type|git)\/(.+?(?=\/)|.+).*/.exec(url);
    return groups ? groups[2] : undefined;
  }

  return {
    request: function(config) {
      if (config.url.indexOf("/ext/") === -1) {
        return config || $q.when(config);
      }

      let workspaceId = getWorkspaceId(config.url);
      if (!workspaceId) {
        return config || $q.when(config);
      }

      return $q.when(tokens[workspaceId] || requestToken(workspaceId))
               .then((token) => {
                 config.headers['Authorization'] = "Bearer " + token;
                 return config;
               })
    },

    responseError: (rejection) => {
      if (rejection && rejection.config.url.indexOf("/ext/") !== -1) {
        delete tokens[getWorkspaceId(rejection.config.url)];
      }
      return $q.reject(rejection);
    }
  }
});

initModule.config(['$routeProvider', '$locationProvider', '$httpProvider', ($routeProvider, $locationProvider, $httpProvider) => {
  $httpProvider.interceptors.push('AddMachineTokenToUrlInterceptor')
  if (DEV) {
    console.log('adding auth interceptor');
    $httpProvider.interceptors.push('AuthInterceptor');
  }
}]);


angular.module('ui.gravatar').config(['gravatarServiceProvider', (gravatarServiceProvider) => {
  gravatarServiceProvider.defaults = {
    size: 43,
    default: 'mm'  // Mystery man as default for missing avatars
  };

  // Use https endpoint
  gravatarServiceProvider.secure = true;

}
]);


var instanceRegister = new Register(initModule);
new CodenvyNavbarConfig(instanceRegister);
new CodenvyComponentsConfig(instanceRegister);
new CodenvyAccountConfig(instanceRegister);
new FactoryConfig(instanceRegister);
new AdminConfig(instanceRegister);
new CodenvyOnpremConfig(instanceRegister);
