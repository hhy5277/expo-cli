import _ from 'lodash';
import { Exp } from 'xdl';

import BaseBuilder from '../BaseBuilder';
import { PLATFORMS } from '../constants';
import validateProject from './projectValidator';
import * as credentials from './credentials';
import * as apple from './apple';

class IOSBuilder extends BaseBuilder {
  async run() {
    const projectMetadata = await this.fetchProjectMetadata();
    await validateProject(projectMetadata);
    await this.ensureNoInProgressBuildsExist(projectMetadata);
    await this.prepareCredentials(projectMetadata);
    const experienceId = await this.ensureProjectIsPublished();
    await this.scheduleBuildAndWait(experienceId);
  }

  async getAppleCtx({ bundleIdentifier, username }) {
    if (!this.appleCtx) {
      const authData = await apple.authenticate(this.options);
      this.appleCtx = { ...authData, bundleIdentifier, username };
    }
    return this.appleCtx;
  }

  async fetchProjectMetadata() {
    const { publicUrl } = this.options;

    // We fetch project's manifest here (from Expo servers or user's own server).
    const {
      args: {
        username,
        remoteFullPackageName: experienceName,
        bundleIdentifierIOS: bundleIdentifier,
        sdkVersion,
      },
    } = publicUrl
      ? await Exp.getThirdPartyInfoAsync(publicUrl)
      : await Exp.getPublishInfoAsync(this.projectDir);

    return {
      username,
      experienceName,
      sdkVersion,
      bundleIdentifier,
    };
  }

  async ensureNoInProgressBuildsExist({ sdkVersion }) {
    await this.checkStatus({ platform: PLATFORMS.IOS, sdkVersion });
  }

  async ensureProjectIsPublished() {
    if (this.options.publicUrl) {
      return null;
    } else {
      return await this.ensureReleaseExists(PLATFORMS.IOS);
    }
  }

  async prepareCredentials(projectMetadata) {
    if (this.options.clearCredentials) {
      const credsToClear = await this.clearCredentialsIfRequested(projectMetadata);
      if (credsToClear && this.options.revokeCredentials) {
        await credentials.revoke(
          await this.getAppleCtx(projectMetadata),
          Object.keys(credsToClear)
        );
      }
    }
    const existingCredentials = await credentials.fetch(projectMetadata);
    const missingCredentials = credentials.determineMissingCredentials(existingCredentials);
    if (missingCredentials) {
      console.log(missingCredentials);
      const xxx = await credentials.prompt(this.options, missingCredentials);
      console.log(JSON.stringify(xxx));
      // const newCredentials = await credentials.generate(
      //   await this.getAppleCtx(projectMetadata),
      //   missingCredentials,
      //   existingCredentials
      // );
      // await credentials.update(projectMetadata, newCredentials);
    }
    process.exit(1);
  }

  async clearCredentialsIfRequested(projectMetadata) {
    const credsToClear = this.determineCredentialsToClear();
    if (credsToClear) {
      credentials.clear(projectMetadata, credsToClear);
    }
    return credsToClear;
  }

  determineCredentialsToClear() {
    const clearAll = this.options.clearCredentials;
    const credsToClearAll = {
      distributionCert: Boolean(clearAll || this.options.clearDistCert),
      pushKey: Boolean(clearAll || this.options.clearPushKey),
      // TODO: backward compatibility, remove when all users migrate to push keys
      pushCert: Boolean(clearAll || this.options.clearPushCert),
      provisioningProfile: Boolean(clearAll || this.options.clearProvisioningProfile),
    };
    const credsToClear = _.pickBy(credsToClearAll);
    return _.isEmpty(credsToClear) ? null : credsToClear;
  }
}

export default IOSBuilder;
