/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { SettingsConfiguration } from './settingsConfiguration'

// This array holds keys for session-permanent settings.
// These settings are set as permanent at extension load.
// Changing these keys' values in settings.json during the extension's lifecycle
//     will not reflect until the next time the extension loads.
const sessionPermanentSettings: string[] = [
]

/**
 * This class handles feature access for unreleased features.
 * Access can be granted to a feature by adding a boolean flag to the VS Code settings.json file.
 * Features can be designated as session-permanent: this means that the setting won't change if altered mid-session
 * To designate a feature as session-permanent, add the feature to the sessionPermanentSettings array in this file.
 *
 * Example: use the following setting to add a feature called `newFeature1`:
 * {
 * ...
 *     "aws.toggle.newFeature1": true,
 * ...
 * }
 * This feature can then be accessed by calling FeatureController.isFeatureActive('newFeature1')
 */
export class FeatureController {

    private readonly permanentSettingsMap: Map<string, boolean>

    public constructor (
        private readonly configuration: SettingsConfiguration,
        permanentSettings: string[] = sessionPermanentSettings
    ) {
        this.permanentSettingsMap = new Map<string, boolean>()

        // initialize permanent settings in permanentSettingsMap
        for (const setting of permanentSettings) {
            this.permanentSettingsMap.set(
                setting,
                this.getFeatureStatusFromSettings(setting)
            )
        }
    }

    /**
     * Returns a boolean on whether or not to display a feature
     * @param key Feature key to search for
     */
    public isFeatureActive(key: string): boolean {
        // check session-permanent settings first
        if (this.permanentSettingsMap.has(key)) {
            return !!this.permanentSettingsMap.get(key)
        }

        // if setting isn't session-permanent, dynamically check settings object.
        return this.getFeatureStatusFromSettings(key)
    }

    /**
     * Gets and sanitizes feature status from settings.
     * This ensures that all settings are returned as a boolean value
     * @param key Setting key
     */
    private getFeatureStatusFromSettings(key: string): boolean {
        if (this.configuration.readSetting(`toggle.${key}`)) {
            return !!this.configuration.readSetting(`toggle.${key}`)
        }

        return false
    }
}