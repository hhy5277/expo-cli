import { Credentials } from 'xdl';

import * as consts from '../credentials';
import prompt from '../../../../../prompt';

const existingCredsGettersByType = {
  distributionCert: Credentials.getExistingDistCerts,
  pushKey: Credentials.getExistingPushKeys,
};

async function promptForOverrides(appleCtx, types) {
  const credentials = {};

  const toAskUserFor = [];
  const toGenerate = [];
  for (const _type of types) {
    const definition = consts.CREDENTIALS[_type];
    if (await _willUserProvideCredentialsType(definition.name)) {
      toAskUserFor.push(_type);
    } else {
      if (definition.canReuse) {
        const userCredentialsId = await _askIfWantsToReuse(appleCtx, definition);
        if (userCredentialsId) {
          credentials[_type] = { userCredentialsId };
        } else {
          toGenerate.push(_type);
        }
      } else {
        toGenerate.push(_type);
      }
    }
  }
}

async function _willUserProvideCredentialsType(name) {
  const { answer } = await prompt({
    type: 'list',
    name: 'answer',
    message: `Will you provide your own ${name}?`,
    choices: [
      { name: 'Let Expo handle the process', value: false },
      { name: 'I want to upload my own file', value: true },
    ],
  });
  return answer;
}

async function _askIfWantsToReuse({ username, team }, { type }) {
  const getter = existingCredsGettersByType[type];
  const existingCreds = await getter(username, team);
  if (existingCreds.length === 0) {
    return null;
  }
}

async function _chooseDistCert(username, teamId) {
  const certs = await Credentials.getExistingDistCerts(username, teamId);
  if (certs.length > 0) {
    const choices = certs.map(({ userCredentialId, certId, serialNumber, usedByApps }) => {
      let name = `Serial number: ${serialNumber || 'unknown'}`;

      if (certId) {
        name = `${name}, Certificate ID: ${certId}`;
      }

      if (usedByApps) {
        name = `Used in apps: ${usedByApps.join(', ')} (${name})`;
      }

      return {
        name,
        value: {
          userCredentialId,
          serialNumber,
        },
      };
    });
    choices.push({
      name: 'No, please create a new one',
      value: null,
    });
    const { distCert } = await prompt({
      type: 'list',
      name: 'distCert',
      message: 'Would you like to reuse Distribution Certificate from another app?',
      choices,
    });
    return {
      userCredentialId: distCert && String(distCert.userCredentialId),
      serialNumber: distCert && distCert.serialNumber,
    };
  } else {
    return {};
  }
}

export default promptForOverrides;
