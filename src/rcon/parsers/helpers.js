import { RconEvents } from '../../events';
const getListPlayers = (rconEmitter, body) => {
    const players = [];
    for (const line of body.split('\n')) {
        const match = line.match(/ID: ([0-9]+) \| Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17}) \| Name: (.+) \| Team ID: ([0-9]+) \| Squad ID: ([0-9]+|N\/A) \| Is Leader: (True|False) \| Role: ([A-Za-z0-9_]*)\b/);
        if (!match)
            continue;
        players.push({
            playerID: match[1],
            eosID: match[2],
            steamID: match[3],
            name: match[4],
            teamID: match[5],
            squadID: match[6] !== 'N/A' ? match[6] : null,
            isLeader: match[7] === 'True',
            role: match[8],
        });
    }
    rconEmitter.emit(RconEvents.LIST_PLAYERS, players);
    return players;
};
const getListSquads = (rconEmitter, body) => {
    const squads = [];
    let teamName = null;
    let teamID = null;
    for (const line of body.split('\n')) {
        const match = line.match(/ID: ([0-9]+) \| Name: (.+) \| Size: ([0-9]+) \| Locked: (True|False) \| Creator Name: (.+) \| Creator Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17})/);
        const matchSide = line.match(/Team ID: (1|2) \((.+)\)/);
        if (matchSide) {
            teamID = matchSide[1];
            teamName = matchSide[2];
        }
        if (!match)
            continue;
        squads.push({
            squadID: match[1],
            squadName: match[2],
            size: match[3],
            locked: match[4],
            creatorName: match[5],
            creatorEOSID: match[6],
            creatorSteamID: match[7],
            teamID: teamID,
            teamName: teamName,
        });
    }
    rconEmitter.emit(RconEvents.LIST_SQUADS, squads);
    return squads;
};
const getCurrentMap = (rconEmitter, body) => {
    const match = body.match(/^Current level is (.*), layer is (.*)/);
    let data = {
        level: null,
        layer: null,
    };
    if (match) {
        data = { level: match[1], layer: match[2] };
    }
    rconEmitter.emit(RconEvents.SHOW_CURRENT_MAP, data);
    return data;
};
const getNextMap = (rconEmitter, body) => {
    const match = body.match(/^Next level is (.*), layer is (.*)/);
    let data = {
        level: null,
        layer: null,
    };
    if (match) {
        data = {
            level: match[1] !== '' ? match[1] : null,
            layer: match[2] !== 'To be voted' ? match[2] : null,
        };
    }
    rconEmitter.emit(RconEvents.SHOW_NEXT_MAP, data);
    return data;
};
const getServerInfo = (rconEmitter, body) => {
    var _a, _b;
    try {
        const res = body && body.length && JSON.parse(body);
        const data = {
            serverName: (res === null || res === void 0 ? void 0 : res.ServerName_s) || '',
            maxPlayers: parseInt((res === null || res === void 0 ? void 0 : res.MaxPlayers) || 0),
            publicQueueLimit: parseInt((res === null || res === void 0 ? void 0 : res.PublicQueueLimit_I) || 0),
            reserveSlots: parseInt((res === null || res === void 0 ? void 0 : res.PlayerReserveCount_I) || 0),
            playerCount: parseInt((res === null || res === void 0 ? void 0 : res.PlayerCount_I) || 0),
            a2sPlayerCount: parseInt((res === null || res === void 0 ? void 0 : res.PlayerCount_I) || 0),
            publicQueue: parseInt((res === null || res === void 0 ? void 0 : res.PublicQueue_I) || 0),
            reserveQueue: parseInt((res === null || res === void 0 ? void 0 : res.ReservedQueue_I) || 0),
            currentLayer: (res === null || res === void 0 ? void 0 : res.MapName_s) || '',
            nextLayer: (res === null || res === void 0 ? void 0 : res.NextLayer_s) || '',
            teamOne: ((_a = res === null || res === void 0 ? void 0 : res.TeamOne_s) === null || _a === void 0 ? void 0 : _a.replace(new RegExp(res === null || res === void 0 ? void 0 : res.MapName_s, 'i'), '')) || '',
            teamTwo: ((_b = res === null || res === void 0 ? void 0 : res.TeamTwo_s) === null || _b === void 0 ? void 0 : _b.replace(new RegExp(res === null || res === void 0 ? void 0 : res.MapName_s, 'i'), '')) || '',
            matchTimeout: parseInt((res === null || res === void 0 ? void 0 : res.MatchTimeout_d) || 0),
            matchStartTime: parseInt((res === null || res === void 0 ? void 0 : res.PLAYTIME_I) || 0),
            gameVersion: (res === null || res === void 0 ? void 0 : res.GameVersion_s) || '',
        };
        rconEmitter.emit(RconEvents.SHOW_SERVER_INFO, data);
        return data;
    }
    catch (_c) { }
};
export const helpers = {
    getListPlayers,
    getListSquads,
    getCurrentMap,
    getNextMap,
    getServerInfo,
};
