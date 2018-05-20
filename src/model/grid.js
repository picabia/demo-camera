import { Model, Geometry } from '@picabia/picabia';

class GridModel extends Model {
  constructor (step) {
    super();

    this._step = step || 100;
    this._points = [];
  }

  // -- model

  // -- api

  setPoints (shape) {
    let rect = Geometry.getAABBRect(shape);

    rect[0] = rect[0] - rect[0] % this._step;
    rect[1] = rect[1] - rect[1] % this._step;
    rect[2] = rect[2] + rect[2] % this._step;
    rect[3] = rect[3] + rect[3] % this._step;

    this._points = [];
    for (let ix = rect[0]; ix < rect[0] + rect[2]; ix += this._step) {
      for (let iy = rect[1]; iy < rect[1] + rect[3]; iy += this._step) {
        this._points.push({ x: ix, y: iy });
      }
    }
  }
}

export {
  GridModel
};
