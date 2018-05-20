import { Container, Frame, ViewManager, Viewport, ViewportGroup, Camera, CanvasLayer2d, CanvasRenderer2d, KeyboardInput } from '@picabia/picabia';

import { GameModel } from './model/game';
import { GameView } from './view/game';
import { CameraPosControl } from '../../../picabia/src/render/camera/pos-control';

class Application {
  constructor (dom, cache) {
    this._dom = dom;
    this._cache = cache;

    // -- model

    this._game = new GameModel();

    // -- view

    const containerOptions = {
      mode: 'cover',
      maxPixels: 1500 * 1500
    };
    this._container = new Container('main', this._dom, containerOptions);

    this._vm = new ViewManager();
    this._vm.add(this._container);

    const viewportOptions = {
      pos: { x: 0, y: 0 }
    };
    const viewportConstraints = {
      zoom: { min: 0.5 }
    };
    this._viewportPlayer = new Viewport('camera-player', viewportOptions, viewportConstraints);
    this._vm.add(this._viewportPlayer);

    this._viewportBg = new Viewport('camera-bg', viewportOptions, viewportConstraints);
    this._vm.add(this._viewportBg);

    this._viewportGroup = new ViewportGroup([this._viewportBg, this._viewportPlayer]);

    this._camera = new Camera('camera');
    this._vm.add(this._camera);

    class Controller extends CameraPosControl {
      constructor (options, constraints) {
        super(constraints);

        options = options || {};
        this._lag = options.lag || 500;
        this._length = options.length || 100;

        this._values = [];
      }

      setValue (time, value) {
        super.setValue(time, value);
        this._values.push({time, value: this._nextValue});
        if (this._values.length > this._length) {
          this._values.shift();
        }
      }

      get updateRequired () {
        return this._updateRequired;
      }

      preRender (time) {
        if (this._values.length) {
          const filtered = this._values.filter((item) => time.t - item.time.t < this._lag);
          this._nextValue = filtered.length ? filtered[0].value : this._values[0].value;
          this._values = filtered;
        }
        const changed = !this._value || this._value.x !== this._nextValue.x || this._value.y !== this._nextValue.y;
        this._updateRequired = this._values.length;
        this._value = this._nextValue;
        return changed;
      }
    }

    const controller = new Controller({ lag: 200 });

    this._camera.addPosControl('player-pos', [this._viewportPlayer, this._viewportBg], controller);
    this._camera.addPosControl('player-jump', [this._viewportPlayer]);
    this._camera.addPosControl('player-speed', [this._viewportPlayer, this._viewportBg]);

    this._camera.addZoomControl('player-speed', [this._viewportPlayer, this._viewportBg]);
    this._camera.addZoomControl('player-jump', [this._viewportPlayer]);
    this._camera.addZoomControl('player-shake', [this._viewportBg]);
    this._camera.addZoomControl('oscillator', [this._viewportPlayer, this._viewportBg]);

    this._camera.addAngleControl('player-direction', [this._viewportPlayer, this._viewportBg]);
    this._camera.addAngleControl('oscillator', [this._viewportPlayer, this._viewportBg]);

    this._container.on('resize', (size) => {
      this._viewportGroup.setSize(size);
      this._viewportGroup.setScale(size.h / 1000);
    });

    this._vm.add(new CanvasRenderer2d('2d'));

    this._vm.add(new CanvasLayer2d('layer-bg', this._container));
    this._vm.add(new CanvasLayer2d('layer-1', this._container));

    const rootView = new GameView(this._vm, [this._game]);

    // -- input

    this._keyboard = new KeyboardInput();
    this._keyboard.addGroup('speed', {
      w: 'more',
      s: 'less'
    }, 'center');
    this._keyboard.addGroup('turn', {
      a: 'left',
      d: 'right'
    }, 'center');
    this._keyboard.addGroup('dash', {
      'shift': 'start'
    }, 'stop');
    this._keyboard.addGroup('jump', {
      ' ': 'start'
    }, 'stop');

    this._keyboard.on('control', (control) => this._game.input(control));

    this._keyboard2 = new KeyboardInput();
    this._keyboard2.addGroup('actions', {
      1: 'shuffle'
    });

    this._keyboard2.on('control', (control) => rootView.input(control));

    // -- start

    this.resize();

    const frameOptions = {
      freeze: true,
      maxDelta: 20,
      interval: false,
      intervalMs: 1000 / 50
    };
    this._frame = new Frame(frameOptions);
    this._frame.on('update', (time) => this._game.update(time));
    this._frame.on('render', (time) => this._vm.render(rootView, time));
    this._frame.start();
  }

  resize () {
    this._container.resize();
  }
}

export {
  Application
};
