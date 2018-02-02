/**
 * Track
 */
class Track extends Matreshka.Object {
  constructor(data, parent) {
    super({
      title: data.title,
      artwork_url: data.artwork_url || data.user.avatar_url,
      stream: `${data.stream_url}?client_id=${parent.soundCloudClientID}`
    });
  }

  onRender() {
    this
      .bindNode({
        artwork_url: ':sandbox .artwork',
        stream: ':sandbox audio'
      }, Matreshka.binders.prop('src'))
      .bindNode('title', ':sandbox .title', Matreshka.binders.html());
  }

  play() {
    this.nodes.stream.play();
  }

  stop() {
    this.nodes.stream.pause();
    this.nodes.stream.currentTime = 0;
  }
}

/**
 * Tracks
 */
class Tracks extends Matreshka.Array {
  get Model() {
    return Track;
  }

  get itemRenderer() {
    return '#track_template';
  }

  constructor(soundCloudClientID) {
    super();
    this
      .set({
        query: '',
        soundCloudClientID
      })
      .bindNode({
        sandbox: 'main',
        container: ':sandbox .tracks',
        form: ':sandbox .search',
        query: ':bound(form) .query'
      })
      .on({
        'submit::form': (evt) => {
          evt.preventDefault();
          this.loadTracks().then(data => this.recreate(data));
        },
        '*@ended::stream': (evt) => {
          const track = evt.self;
          this[(this.indexOf(track) + 1) % this.length].play();
        },
        '*@play::stream': (evt) => {
          const track = evt.self;
          if (this.lastPlayed && this.lastPlayed !== track) {
            this.lastPlayed.stop();
          }

          this.lastPlayed = track;
        }
      });

    if (this.query) {
      this.loadTracks().then(data => this.recreate(data));
    }
  }

  loadTracks() {
    const params = {
      q: this.query,
      client_id: this.soundCloudClientID,
      limit: 49,
      offset: 0,
      filter: 'streamable',
      order: 'hotness'
    };

    const paramsStr = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');

    return fetch(`https://api.soundcloud.com/tracks.json?${paramsStr}`).then(resp => resp.json());
  }
}

// Initialize app
window.app = new Tracks('59e3c5f100a1624a44281833b833fed0');