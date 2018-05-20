import { Model, Emitter } from '@picabia/picabia';

import { PlayerModel } from './player';
import { GridModel } from './grid';

class GameModel extends Model {
  constructor () {
    super();

    this._emitter = new Emitter();
    Emitter.mixin(this, this._emitter);

    this._controls = {
      'speed:more': () => this._player.setAcceleration(1),
      'speed:less': () => this._player.setAcceleration(-1),
      'speed:center': () => this._player.setAcceleration(0),
      'dash:start': () => this._player.startDash(),
      'dash:stop': () => this._player.stopDash(),
      'turn:left': () => this._player.setTurn(-1),
      'turn:right': () => this._player.setTurn(1),
      'turn:center': () => this._player.setTurn(0),
      'jump:start': () => this._player.startJump(),
      'jump:stop': () => this._player.stopJump()
    };
  }

  // -- model

  _preInit () {
    this._player = new PlayerModel();
    this._addChild(this._player);
    this._emitter.emit('new-player', this._player);

    this._grid = new GridModel();
    this._addChild(this._grid);
    this._emitter.emit('new-grid', this._grid);
  }

  _destroy () {
    this._emitter.destroy();
  }

  // -- api

  input (control) {
    const args = [...arguments];
    args.unshift();
    this._controls[control](...args);
  }
}

export {
  GameModel
};
