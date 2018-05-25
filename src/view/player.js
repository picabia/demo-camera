import { View, Geometry } from '@picabia/picabia';

import {PlayerShadowView} from './player-shadow';

class PlayerView extends View {
  constructor (v, target, player) {
    super(v, target);

    this._player = player;

    this._createChild(PlayerShadowView, { viewport: 'bg', layer: 'stage', zIndex: this._zIndex - 1 }, player);
  }

  // -- view

  render (renderer) {
    const rgba = 'rgba(100, 10, 10, 1)';

    const polygon = this._player._shape
      .map((vector) => ({ x: vector.x + this._player._pos.x, y: vector.y + this._player._pos.y }))
      .map(vector => Geometry.rotateVector(vector, -this._player._facing - Math.PI / 2, this._player._pos));

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
