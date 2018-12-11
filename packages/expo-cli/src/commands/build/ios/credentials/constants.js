const CREDENTIALS = {
  distributionCert: {
    id: 'distributionCert',
    canReuse: true,
    name: 'Apple Distribution Certificate',
    required: ['certP12', 'certPassword'],
    questions: {
      certP12: {
        question: 'Path to P12 file:',
        type: 'file',
        base64Encode: true,
      },
      certPassword: {
        type: 'password',
        question: 'P12 password:',
      },
    },
  },
  pushKey: {
    id: 'pushKey',
    canReuse: true,
    name: 'Apple Push Notifications service key',
    required: ['apnsKeyP8', 'apnsKeyId'],
    questions: {
      apnsKeyP8: {
        type: 'file',
        question: 'Path to P8 file:',
      },
      apnsKeyId: {
        type: 'string',
        question: 'Key ID:',
      },
    },
  },
  provisioningProfile: {
    id: 'provisioningProfile',
    name: 'Apple Provisioning Profile',
    required: ['provisioningProfile'],
    questions: {
      provisioningProfile: {
        type: 'file',
        question: 'Path to .mobile provisioning profile:',
        base64Encode: true,
      },
    },
  },
  pushCert: {
    id: 'pushCert',
    name: 'Apple Push Notifications certificate',
    required: ['pushP12', 'pushPassword'],
    deprecated: true,
  },
};

const CREDENTIALS_DEPENDENCIES = {
  [CREDENTIALS.distributionCert.id]: CREDENTIALS.provisioningProfile.id,
};

// Order of elements in the following array matters.
// We have to generate Distribution Certificate prior to generating Provisioning Profile.
const REQUIRED_CREDENTIALS = [
  CREDENTIALS.distributionCert,
  { or: [CREDENTIALS.pushKey, CREDENTIALS.pushCert] },
  CREDENTIALS.provisioningProfile,
];

const EXPO_WILL_GENERATE = 'EXPO_PLEASE_GENERATE_THIS_FOR_ME';

export { CREDENTIALS, CREDENTIALS_DEPENDENCIES, REQUIRED_CREDENTIALS, EXPO_WILL_GENERATE };
