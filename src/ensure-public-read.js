'use strict';

// Public (no token) read access the blog frontends rely on. The template seeder grants article,
// category, author, global and about once, on the first boot of an empty database, and nothing on
// tag, so `populate[tags]` came back empty for anonymous requests. The site and the Accessibility
// Simulator match articles by tag, so make sure the Public role can read tags. Idempotent: an
// existing permission is left alone, and nothing is ever removed.
const PUBLIC_READ = ['api::tag.tag.find', 'api::tag.tag.findOne'];

module.exports = async function ensurePublicRead({ strapi }) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!publicRole) {
    strapi.log.warn('[ensure-public-read] public role not found');
    return;
  }
  const permissions = strapi.query('plugin::users-permissions.permission');
  for (const action of PUBLIC_READ) {
    const existing = await permissions.findOne({ where: { action, role: publicRole.id } });
    if (existing) continue;
    try {
      await permissions.create({ data: { action, role: publicRole.id } });
      strapi.log.info(`[ensure-public-read] granted ${action} to public`);
    } catch (error) {
      strapi.log.error(`[ensure-public-read] could not grant ${action}: ${error.message}`);
    }
  }
};
