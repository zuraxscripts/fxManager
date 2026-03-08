fx_version 'cerulean'
game { 'gta5', 'rdr3' }

name        'fxmanager'
description 'FiveM Panel — server-side resource bridge'
version     '0.1.0'

server_scripts {
  'config.lua',
  'server/main.lua',
}

client_scripts {
  'client/main.lua',
}
