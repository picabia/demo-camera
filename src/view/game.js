import { View, Time, Wave, Vector } from '@picabia/picabia';

import { BgView } from './bg';
import { PlayerView } from './player';
import { GridView } from './grid';

class GameView extends View {
  _constructor (game) {
    this._game = game;
    this._camera = this._vm.get('camera');

    this._createChild(BgView, [], '2d', 'camera-bg', 'layer-1');

    this._game.on('new-player', (player) => {
      this._createChild(PlayerView, [player], '2d', 'camera-player', 'layer-1', 0);
      this._camera.setAngle('player-direction', player.time, -Math.PI / 2);

      player.on('moving', (player) => {
        this._camera.setPos('player-pos', player.time, { x: player._pos.x, y: player._pos.y });
        const vector = Vector.fromRadians(player._dir);
        const displacemenet = { x: vector.x * player._speed ** 3 * 120, y: vector.y * player._speed ** 3 * 120 };
        this._camera.setPos('player-speed', player.time, displacemenet);
        this._camera.setZoom('player-speed', player.time, 1 - player._speed / 5);
        this._camera.setAngle('player-direction', player.time, -Math.PI / 2 - player._dir);
      });

      player.on('jumping', (player) => {
        this._camera.setZoom('player-jump', player.time, 1 + player._height / 30);
        this._camera.setPos('player-jump', player.time, { x: player._height * -3, y: 0 });
      });

      player.on('jump-land', (player) => {
        if (!this._landWave) {
          const shake = (player._jumpHeight / 10 + player._speed / 2) / 10;
          this._landWave = Wave.triangle(player.time.t, 1 - shake / 2, shake, 200, Math.PI / 2);
          this._landWaveOff = Time.run(this._time.t, 400);
        }
      });
    });

    this._game.on('new-grid', (grid) => {
      this._createChild(GridView, [grid], '2d', 'camera-bg', 'layer-bg', 1);
    });

    this._controls = {
      'move:left': () => {},
      'move:right': () => {},
      'move:center': () => {},
      'jump:start': () => {},
      'jump:stop': () => {}
    };
  }

  _preInit () {
    this._oscillator1 = Wave.sine(this._time.t, 0, 0.1, 5000);
    this._oscillator2 = Wave.triangle(this._time.t, 0, 5, 500);
  }

  _preUpdate () {
    this._camera.setZoom('oscillator', this.time, 1 - this._oscillator1(this._time.t));
    this._camera.setAngle('oscillator', this.time, this._oscillator2(this._time.t) / 100);

    if (this._landWave) {
      const value = this._landWave(this._time.t);
      this._camera.setZoom('player-shake', this.time, value);
      this._landWaveOff(this._time.t, () => {
        this._landWave = null;
        this._camera.setZoom('player-shake', this.time, 1);
      });
    }
  }

  // -- public

  input (control) {
    const args = [...arguments];
    args.unshift();
    this._controls[control](...args);
  }
}

export {
  GameView
};
