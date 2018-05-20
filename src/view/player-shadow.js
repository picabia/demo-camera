import { View, Geometry } from '@picabia/picabia';

class PlayerShadowView extends View {
  _constructor (player) {
    this._player = player;
  }

  // -- view

  _render () {
    const rgba = 'rgba(0, 0, 0, 0.5)';

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
  PlayerShadowView
};
