import { View, Time } from '@picabia/picabia';

class GridView extends View {
  _constructor (grid) {
    this._grid = grid;

    this._grid.setPoints(this._viewport.getShape());

    this._viewport.on('change', Time.throttle(() => {
      this._grid.setPoints(this._viewport.getShape());
    }, 100));
  }

  // -- view

  _render () {
    const points = this._grid._points;

    const renderer = this._renderer;

    renderer.setStrokeWidth(1);
    renderer.setFillStyle('rgba(1, 1, 1, 1)');
    points.forEach(point => {
      renderer.beginPath();
      renderer.moveTo(point.x - 5, point.y);
      renderer.lineTo(point.x + 5, point.y);
      renderer.stroke();
      renderer.moveTo(point.x, point.y + 5);
      renderer.lineTo(point.x, point.y - 5);
      renderer.stroke();
    });
  }
}

export {
  GridView
};
