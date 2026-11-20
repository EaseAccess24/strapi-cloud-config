'use strict';

// Blog locales. Article is localized (i18n); these locales must exist for editors and for the
// translation import. Locales can only be created through the admin, so we create missing ones
// on boot. Existing locales (including ones added by hand in the admin) are left untouched.
const BLOG_LOCALES = [
  { code: 'de', name: 'German (de)' },
  { code: 'fr', name: 'French (fr)' },
  { code: 'es', name: 'Spanish (es)' },
  { code: 'it', name: 'Italian (it)' },
  { code: 'nl', name: 'Dutch (nl)' },
  { code: 'pl', name: 'Polish (pl)' },
  { code: 'sv', name: 'Swedish (sv)' },
  { code: 'hr', name: 'Croatian (hr)' },
  { code: 'mk', name: 'Macedonian (mk)' },
];

module.exports = async function ensureLocales({ strapi }) {
  const locales = strapi.plugin('i18n').service('locales');
  const existing = new Set((await locales.find()).map((l) => l.code));
  for (const locale of BLOG_LOCALES) {
    if (existing.has(locale.code)) continue;
    try {
      await locales.create(locale);
      strapi.log.info(`[ensure-locales] created locale ${locale.code}`);
    } catch (error) {
      strapi.log.error(`[ensure-locales] could not create locale ${locale.code}: ${error.message}`);
    }
  }
};
