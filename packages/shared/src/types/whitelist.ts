/** Details:
 * * 'identifier'   - any identifier logged in the "whitelisted_identifiers" table
 * * 'discord'      - discord role check
 * * 'admin-only'   - only admins with a linked player can connect
 * * 'none'         - no whitelisting
 */
export type WhitelistMode = 'none' | 'identifier' | 'discord' | 'admin-only';
