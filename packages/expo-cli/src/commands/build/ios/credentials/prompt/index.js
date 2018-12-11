import _ from 'lodash';

import getFromParams from './paramsProvided';
import promptForCredentials from './userProvided';
import promptForOverrides from './expoManaged';
import * as consts from '../constants';
import log from '../../../../../log';
import _prompt from '../../../../../prompt';

async function prompt(appleCtx, options, missingCredentials) {
  const credentialsFromParams = await getFromParams(options);
  const stillMissingCredentials = _.difference(
    missingCredentials,
    Object.keys(credentialsFromParams)
  );

  const names = stillMissingCredentials.map(id => consts.CREDENTIALS[id].name).join(', ');
  log.warn(`We do not have some credentials for you: ${names}`);

  const credentials = (await _shouldExpoGenerateCerts())
    ? await promptForOverrides(appleCtx, stillMissingCredentials)
    : await promptForCredentials(appleCtx, stillMissingCredentials);

  const merged = _.merge({}, credentialsFromParams, credentials);
  return _flattenObject(merged);
}

async function _shouldExpoGenerateCerts() {
  const { expoShouldGenerateCerts } = await _prompt({
    type: 'list',
    name: 'expoShouldGenerateCerts',
    message: 'How would you like to upload your credentials?\n',
    choices: [
      {
        name: 'Expo handles all credentials, you can still provide overrides',
        value: true,
      },
      {
        name: 'I will provide all the credentials and files needed, Expo does limited validation',
        value: false,
      },
    ],
  });
  return expoShouldGenerateCerts;
}

const _flattenObject = obj => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (_.isObject(value)) {
      return { ...acc, ..._flattenObject(value) };
    } else {
      return { ...acc, [key]: value };
    }
  }, {});
};

export default prompt;
