-- fxmanager: server/main.lua
-- Bridges in-game events to the panel web server

local headers = {
  ['Content-Type']      = 'application/json',
  ['x-resource-token']  = Config.ApiToken,
}

local function postToPanel(path, body, cb)
  PerformHttpRequest(
    Config.PanelUrl .. path,
    function(status, response)
      if status ~= 200 then
        print('^1[fxmanager] HTTP error on ' .. path .. ': ' .. tostring(status) .. '^7')
        return
      end
      if cb then cb(json.decode(response)) end
    end,
    'POST',
    json.encode(body),
    headers
  )
end

-- ─── Player connect: check ban status ────────────────────────────────────────

AddEventHandler('playerConnecting', function(name, setKickReason, deferrals)
  local source  = source
  local license = GetPlayerIdentifierByType(source, 'license')

  if not license then
    setKickReason('Could not verify your license.')
    CancelEvent()
    return
  end

  deferrals.defer()
  deferrals.update('Checking your account...')

  postToPanel('/resource/player/connect', { license = license, name = name }, function(res)
    if res and res.banned then
      deferrals.done('You are banned from this server.')
    else
      deferrals.done()
    end
  end)
end)

-- ─── Periodic player sync ─────────────────────────────────────────────────────

local function syncPlayers()
  local playerList = {}

  for _, playerId in ipairs(GetPlayers()) do
    local id      = tonumber(playerId)
    local license = GetPlayerIdentifierByType(id, 'license')
    if license then
      table.insert(playerList, {
        license     = license,
        name        = GetPlayerName(id),
        serverNetId = id,
        ping        = GetPlayerPing(id),
      })
    end
  end

  if #playerList > 0 then
    postToPanel('/resource/players/sync', { players = playerList })
  end
end

CreateThread(function()
  while true do
    Wait(Config.SyncInterval)
    syncPlayers()
  end
end)

print('^2[fxmanager] Resource started. Connecting to ' .. Config.PanelUrl .. '^7')
