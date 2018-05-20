import { View, Geometry } from '@picabia/picabia';

import {PlayerShadowView} from './player-shadow';

class PlayerView extends View {
  _constructor (player) {
    this._player = player;

    this._createChild(PlayerShadowView, [player], '2d', 'camera-bg', 'layer-1', this._zIndex - 1);
  }

  // -- view

  _render () {
    const rgba = 'rgba(100, 10, 10, 1)';

    const polygon = this._player._shape
      .map((vector) => ({ x: vector.x + this._player._pos.x, y: vector.y + this._player._pos.y }))
      .map(vector => Geometry.rotateVector(vector, -this._player._facing - Math.PI / 2, this._player._pos));

    const renderer = this._renderer;

    renderer.setFillStyle(rgba);
    renderer.beginPath();
    polygon.forEach(vector => renderer.lineTo(vector.x, vector.y));
    renderer.lineTo(polygon[0].x, polygon[0].y);
    renderer.fill();
  }
}

export {
  PlayerView
};
