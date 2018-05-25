import { Container, Frame, ViewEngine, Viewport, ViewportGroup, Camera, CanvasLayer2d, CanvasRenderer2d, KeyboardInput } from '@picabia/picabia';
import { FpsCanvas } from '@picabia/component-fps';

import { GameModel } from './model/game';
import { GameView } from './view/game';

import { CameraPosControlLaggy } from './lib/render/camera-pos-control-laggy';

class Application {
  constructor (dom, cache) {
    this._cache = cache;

    // -- model

    this._game = new GameModel();

    // -- view

    const containerOptions = {
      mode: 'cover',
      maxPixels: 1500 * 1500
    };
    this._container = new Container('main', dom, containerOptions);

    this._v = new ViewEngine(dom);
    this._v.add(this._container);

    const renderer = this._v.add(new CanvasRenderer2d('2d'));

    const viewportOptions = {
      pos: { x: 0, y: 0 }
    };
    const viewportConstraints = {
      zoom: { min: 0.5 }
    };
    this._viewportPlayer = new Viewport('player', viewportOptions, viewportConstraints);
    this._v.add(this._viewportPlayer);

    this._viewportBg = new Viewport('bg', viewportOptions, viewportConstraints);
    this._v.add(this._viewportBg);

    this._viewportGroup = new ViewportGroup('motion', [this._viewportBg, this._viewportPlayer]);

    this._camera = new Camera('one');
    this._v.add(this._camera);

    const cameraPosControl = new CameraPosControlLaggy({ lag: 200 });

    this._camera.addPosControl('player-pos', [this._viewportPlayer, this._viewportBg], cameraPosControl);
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

    this._v.add(new CanvasLayer2d('bg', this._container));
    this._v.add(new CanvasLayer2d('stage', this._container));
    this._v.add(new FpsCanvas(this._v, { renderer }, this._container));

    const gameController = this._v.add(new GameView(this._v, { renderer }, this._game));

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

    this._keyboard2.on('control', (control) => gameController.input(control));

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
    this._frame.on('render', (time) => this._v.render(time));
    this._frame.start();
  }

  resize () {
    this._container.resize();
    this._v.resize();
  }
}

export {
  Application
};
