var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EventEmitter from 'events';
import net from 'net';
import { initLogger } from '../logger';
import { ERconResponseType, } from '../types';
import { chatParser, commandParser, helpers } from './parsers';
const EMPTY_PACKET_ID = 100;
const AUTH_PACKET_ID = 101;
export class Rcon extends EventEmitter {
    constructor(options) {
        super();
        this.soh = {
            size: 7,
            id: 0,
            type: ERconResponseType.SERVERDATA_RESPONSE,
            body: '',
        };
        this.commandId = 0;
        this.responseBody = '';
        this.connected = false;
        this.lastDataBuffer = Buffer.alloc(0);
        this.responseTaskQueue = [];
        this.lastCommands = [];
        this.encode = (type, id, body) => {
            const size = Buffer.byteLength(body) + 14;
            const buf = Buffer.alloc(size);
            buf.writeInt32LE(size - 4, 0);
            buf.writeInt32LE(id, 4);
            buf.writeInt32LE(type, 8);
            buf.write(body, 12, size - 2, 'utf-8');
            buf.writeInt16LE(0, size - 2);
            return buf;
        };
        for (const option of ['id', 'host', 'port', 'password'])
            if (!(option in options))
                throw new Error(`${option} required!`);
        const { id, host, port, password, pingDelay, autoReconnect = true, autoReconnectDelay = 10000, logEnabled, } = options;
        this.id = id;
        this.host = host;
        this.port = port;
        this.password = password;
        this.pingDelay = pingDelay;
        this.autoReconnect = autoReconnect;
        this.autoReconnectDelay = autoReconnectDelay;
        this.chatListeners = this.chatListeners;
        this.logger = initLogger(id, typeof logEnabled === 'undefined' ? true : logEnabled);
    }
    init() {
        return new Promise((res, rej) => {
            this.once('connected', () => res(true));
            this.once('close', () => rej('Connection error'));
            this.connect();
        });
    }
    close() {
        return new Promise((res) => {
            var _a;
            this.once('close', () => res(true));
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.end();
        });
    }
    execute(command) {
        return new Promise((resolve, reject) => {
            var _a, _b;
            this.lastCommands.push(command);
            this.responseTaskQueue.push((response) => {
                if (!this.connected) {
                    reject();
                }
                resolve(response);
            });
            this.commandId = this.commandId >= 80 ? 1 : this.commandId + 1;
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(this.encode(ERconResponseType.SERVERDATA_COMMAND, this.commandId, command));
            (_b = this.client) === null || _b === void 0 ? void 0 : _b.write(this.encode(ERconResponseType.SERVERDATA_COMMAND, EMPTY_PACKET_ID, ''));
        });
    }
    getListPlayers() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.execute('ListPlayers');
            return helpers.getListPlayers(this, response);
        });
    }
    getListSquads() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.execute('ListSquads');
            return helpers.getListSquads(this, response);
        });
    }
    getCurrentMap() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.execute('ShowCurrentMap');
            return helpers.getCurrentMap(this, response);
        });
    }
    getNextMap() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.execute('ShowNextMap');
            return helpers.getNextMap(this, response);
        });
    }
    getServerInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.execute('ShowServerInfo');
            return helpers.getServerInfo(this, response);
        });
    }
    connect() {
        this.lastCommands = [];
        this.responseTaskQueue = [];
        this.client = net.createConnection({
            host: this.host,
            port: this.port,
            noDelay: false,
        });
        this.logger.log('Connecting');
        this.client.on('data', (data) => {
            this.onData(data);
        });
        this.client.on('close', () => {
            this.onCloseConnection();
        });
        this.client.on('error', (error) => {
            this.onErrorConnection(error);
        });
        this.client.once('ready', () => {
            this.onAuth();
        });
    }
    reconnect() {
        this.connected = false;
        if (this.autoReconnect && !this.connected) {
            setTimeout(() => {
                var _a;
                (_a = this.client) === null || _a === void 0 ? void 0 : _a.end();
                this.logger.log('Reconnecting');
                this.connect();
            }, this.autoReconnectDelay);
        }
        clearInterval(this.timerPing);
    }
    onData(data) {
        this.lastDataBuffer = Buffer.concat([this.lastDataBuffer, data], this.lastDataBuffer.byteLength + data.byteLength);
        while (this.lastDataBuffer.byteLength >= 7) {
            const packet = this.decode();
            if (!packet)
                break;
            if (packet.type === ERconResponseType.SERVERDATA_RESPONSE)
                this.onResponse(packet);
            else if (packet.type === ERconResponseType.SERVERDATA_SERVER) {
                chatParser(this, packet, this.chatListeners);
                this.emit('data', packet);
            }
            else if (packet.type === ERconResponseType.SERVERDATA_COMMAND) {
                if (packet.id === AUTH_PACKET_ID) {
                    this.logger.log('Authorization successful');
                    this.onConnected();
                }
                else if (packet.id === -1) {
                    this.logger.error('Authorization failed');
                    this.reconnect();
                }
            }
        }
    }
    onResponse(packet) {
        var _a;
        if (packet.body === '') {
            commandParser(this, this.responseBody, this.lastCommands[0]);
            this.lastCommands.shift();
            (_a = this.responseTaskQueue.shift()) === null || _a === void 0 ? void 0 : _a(this.responseBody);
            this.responseBody = '';
        }
        else if (!packet.body.includes('')) {
            this.responseBody = this.responseBody += packet.body;
        }
        else
            this.badPacket();
    }
    onConnected() {
        if (!this.connected) {
            this.connected = true;
            this.emit('connected');
            this.timerPing = setInterval(() => {
                this.ping();
            }, this.pingDelay || 60000 * 2);
        }
    }
    onAuth() {
        var _a;
        this.logger.log('Authorization in progress');
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(this.encode(ERconResponseType.SERVERDATA_AUTH, AUTH_PACKET_ID, this.password));
    }
    onCloseConnection() {
        this.emit('close');
        this.logger.error('Connection close');
        this.reconnect();
    }
    onErrorConnection(error) {
        this.emit('err', error);
        this.logger.error('Connection error');
    }
    decode() {
        if (this.lastDataBuffer[0] === 0 &&
            this.lastDataBuffer[1] === 1 &&
            this.lastDataBuffer[2] === 0 &&
            this.lastDataBuffer[3] === 0 &&
            this.lastDataBuffer[4] === 0 &&
            this.lastDataBuffer[5] === 0 &&
            this.lastDataBuffer[6] === 0) {
            this.lastDataBuffer = this.lastDataBuffer.subarray(7);
            return this.soh;
        }
        const bufSize = this.lastDataBuffer.readInt32LE(0);
        if (bufSize > 8192 || bufSize < 10) {
            this.badPacket();
            return null;
        }
        else if (bufSize <= this.lastDataBuffer.byteLength - 4) {
            const bufId = this.lastDataBuffer.readInt32LE(4);
            const bufType = this.lastDataBuffer.readInt32LE(8);
            if (this.lastDataBuffer[bufSize + 2] !== 0 ||
                this.lastDataBuffer[bufSize + 3] !== 0 ||
                bufId < 0 ||
                bufType < 0 ||
                bufType > 5) {
                this.badPacket();
                return null;
            }
            else {
                const response = {
                    size: bufSize,
                    id: bufId,
                    type: bufType,
                    body: this.lastDataBuffer.toString('utf8', 12, bufSize + 2),
                };
                this.lastDataBuffer = this.lastDataBuffer.subarray(bufSize + 4);
                return response;
            }
        }
        else
            return null;
    }
    badPacket() {
        this.logger.error('Bad packet');
        this.lastDataBuffer = Buffer.alloc(0);
        return null;
    }
    ping() {
        this.logger.log('Ping connection');
        this.execute('PING_CONNECTION');
    }
}
