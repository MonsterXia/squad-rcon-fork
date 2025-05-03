import { RconEvents } from '../../events';
export function chatParser(rconEmitter, packet, listeners) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { body } = packet;
    const matchChat = body.match(/\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[Online IDs:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+?) : (.*)/);
    if (matchChat) {
        const data = {
            raw: body,
            chat: matchChat[1],
            eosID: matchChat[2],
            steamID: matchChat[3],
            name: matchChat[4],
            message: matchChat[5],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.CHAT_MESSAGE, data);
        (_a = listeners === null || listeners === void 0 ? void 0 : listeners.onChatMessage) === null || _a === void 0 ? void 0 : _a.call(listeners, data);
        return;
    }
    const matchPossessedAdminCam = body.match(/\[Online Ids:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+) has possessed admin camera\./);
    if (matchPossessedAdminCam) {
        const data = {
            raw: body,
            eosID: matchPossessedAdminCam[1],
            steamID: matchPossessedAdminCam[2],
            name: matchPossessedAdminCam[3],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.POSSESSED_ADMIN_CAMERA, data);
        (_b = listeners === null || listeners === void 0 ? void 0 : listeners.onPossessedAdminCamera) === null || _b === void 0 ? void 0 : _b.call(listeners, data);
        return;
    }
    const matchUnpossessedAdminCam = body.match(/\[Online IDs:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+) has unpossessed admin camera\./);
    if (matchUnpossessedAdminCam) {
        const data = {
            raw: body,
            eosID: matchUnpossessedAdminCam[1],
            steamID: matchUnpossessedAdminCam[2],
            name: matchUnpossessedAdminCam[3],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.UNPOSSESSED_ADMIN_CAMERA, data);
        (_c = listeners === null || listeners === void 0 ? void 0 : listeners.onUnPossessedAdminCamera) === null || _c === void 0 ? void 0 : _c.call(listeners, data);
        return;
    }
    const matchWarn = body.match(/Remote admin has warned player (.*)\. Message was "(.*)"/);
    if (matchWarn) {
        const data = {
            raw: body,
            name: matchWarn[1],
            reason: matchWarn[2],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.PLAYER_WARNED, data);
        (_d = listeners === null || listeners === void 0 ? void 0 : listeners.onPlayerWarned) === null || _d === void 0 ? void 0 : _d.call(listeners, data);
        return;
    }
    const matchKick = body.match(/Kicked player ([0-9]+)\. \[Online IDs= EOS: ([0-9a-f]{32}) steam: (\d{17})] (.*)/);
    if (matchKick) {
        const data = {
            raw: body,
            playerID: matchKick[1],
            eosID: matchKick[2],
            steamID: matchKick[3],
            name: matchKick[4],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.PLAYER_KICKED, data);
        (_e = listeners === null || listeners === void 0 ? void 0 : listeners.onPlayerKicked) === null || _e === void 0 ? void 0 : _e.call(listeners, data);
        return;
    }
    const matchBan = body.match(/Banned player ([0-9]+)\. \[steamid=(.*?)\] (.*) for interval (.*)/);
    if (matchBan) {
        const data = {
            raw: body,
            playerID: matchBan[1],
            steamID: matchBan[2],
            name: matchBan[3],
            interval: matchBan[4],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.PLAYER_BANNED, data);
        (_f = listeners === null || listeners === void 0 ? void 0 : listeners.onPlayerBanned) === null || _f === void 0 ? void 0 : _f.call(listeners, data);
        return;
    }
    const matchSqCreated = body.match(/(.+) \(Online IDs: EOS: ([0-9a-f]{32}) steam: (\d{17})\) has created Squad (\d+) \(Squad Name: (.+)\) on (.+)/);
    if (matchSqCreated) {
        const data = {
            raw: body,
            name: matchSqCreated[1],
            eosID: matchSqCreated[2],
            steamID: matchSqCreated[3],
            squadID: matchSqCreated[4],
            squadName: matchSqCreated[5],
            teamName: matchSqCreated[6],
            time: new Date(),
        };
        rconEmitter.emit(RconEvents.SQUAD_CREATED, data);
        (_g = listeners === null || listeners === void 0 ? void 0 : listeners.onSquadCreated) === null || _g === void 0 ? void 0 : _g.call(listeners, data);
        return;
    }
}
