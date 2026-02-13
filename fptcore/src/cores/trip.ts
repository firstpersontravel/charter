const moment = require('moment');

const TimeUtil = require('../utils/time').default;

import type { ScriptContent, ScriptVariant, TripFields } from '../types';

class TripCore {
  /**
   * Get variants are active given a list of variant names.
   * Do default ones first, then non-defaults (non-defaults override defaults).
   */
  static _getActiveVariants(scriptContent: ScriptContent, variantNames: string[]): ScriptVariant[] {
    const variants = scriptContent.variants || [];
    return variants
      .filter(function(variant) {
        if (variant.default) {
          return true;
        }
        if (variantNames.includes(variant.name)) {
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.default !== b.default) {
          return a.default ? -1 : 1;
        }
        return a.name > b.name ? 1 : -1;
      });
  }

  /**
   * Get initial fields for a trip from variants.
   */
  static getInitialFields(scriptContent: ScriptContent, date: string, timezone: string, variantNames: string[]): TripFields {
    const fields: TripFields = {
      tripState: {
        currentSceneName: '',
        currentPageNamesByRole: {}
      },
      customizations: {},
      values: {},
      waypointOptions: {},
      schedule: {}
    };
    const variants = this._getActiveVariants(scriptContent, variantNames);
    variants.forEach((variant) => {
      if (variant.customizations) {
        Object.assign(fields.customizations, variant.customizations);
      }
      if (variant.waypoint_options) {
        Object.assign(fields.waypointOptions, variant.waypoint_options);
      }
      if (variant.initial_values) {
        Object.assign(fields.values, variant.initial_values);
      }
      if (variant.schedule) {
        const day = moment(date).format('YYYY-MM-DD');
        Object.keys(variant.schedule).forEach((key: string) => {
          fields.schedule[key] = TimeUtil.convertTimeShorthandToIso(
            variant.schedule![key], day, timezone);
        });
      }
    });
    return fields;
  }
}

export default TripCore;

