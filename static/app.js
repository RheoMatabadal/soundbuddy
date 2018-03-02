/**
 * 
 * Track
 * 
 */
class Track extends Matreshka.Object {
  /**
   * Constructor
   * @param {*} data
   * @param {*} parent 
   */
  constructor(data, parent) {
    super({
      copy_id: 'copy-' + data.id,
      target_copy_id: '#copy-' + data.id,
      username: data.user.username,
      title: data.title,
      artwork_url: data.artwork_url || data.user.avatar_url,
      stream: `${data.stream_url}?client_id=${parent.soundCloudClientID}`
    });
  }

  /**
   * On render
   */
  onRender() {
    this
      .bindNode({
        artwork_url: ':sandbox .artwork',
        stream: ':sandbox audio'
      }, Matreshka.binders.prop('src'))
      .bindNode('username', ':sandbox .username', Matreshka.binders.html())
      .bindNode('title', ':sandbox .title', Matreshka.binders.html())
      .bindNode('copy_id', ':sandbox .title', Matreshka.binders.prop('id'))
      .bindNode('target_copy_id', ':sandbox .copy', Matreshka.binders.attr('data-clipboard-target'))
      .bindNode('stream', ':sandbox .download', Matreshka.binders.prop('href'));
  }
}

/**
 * 
 * Tracks
 * 
 */
class Tracks extends Matreshka.Array {
  /**
   * Get model
   */
  get Model() {
    return Track;
  }

  /**
   * Item renderer
   */
  get itemRenderer() {
    return '#track_template';
  }

  /**
   * Constructor
   * @param {*} soundCloudClientID 
   */
  constructor(soundCloudClientID) {
    super();
    this
      .set({
        collection: [], // Array to hold all tracks
        linked_partitioning: 1, // Paginate to next page
        query: '', // Search query
        soundCloudClientID // SoundCloud client ID
      })
      .bindNode({
        sandbox: 'main',
        container: ':sandbox .tracks',
        form: ':sandbox .search',
        query: ':bound(form) .query',
        load_more: '.load_more'
      })
      .on({
        'submit::form': (evt) => {
          // Cancel default form submit
          evt.preventDefault();

          // Prevent issues to access the global scope within nested functions 
          const self = this;

          // Reset pagination
          this.linked_partitioning = 1;

          // Load tracks
          this.loadTracks().then((data) => {
            // Render searched
            document.querySelector('.searched').innerHTML = `Search results for "${self.query}"`;
            // Update collection array
            self.collection = data.collection;
            // Toggle load more button
            self.toggleLoadMore(data.next_href);

            // Render template
            this.recreate(self.collection);
          });
        },
        'click::load_more': (evt) => {
          // Prevent issues to access the global scope within nested functions 
          const self = this;

          // Increment pagination
          this.linked_partitioning += 1;

          this.loadTracks().then((data) => {
            // Update collection array
            self.addTracksToCollection(data.collection);
            // Toggle load more button            
            self.toggleLoadMore(data.next_href);

            // Render template
            this.recreate(self.collection);
          });
        }
      });
  }

  /**
   * Load tracks
   */
  loadTracks() {
    // Promise
    return new Promise((resolve) => {
      // Parameters
      const params = {
        q: this.query,
        client_id: this.soundCloudClientID,
        filter: 'streamable',
        // order: 'hotness',
        limit: 20,
        offset: 0,
        linked_partitioning: this.linked_partitioning
      };

      // API url
      const url = 'https://api.soundcloud.com/tracks.json?' + Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
      // let url = 'data/tracks.json'; // Dummy data

      // AJAX
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200)
          // Return response
          resolve(JSON.parse(this.responseText));
      };
      xhttp.open('GET', url, true);
      xhttp.send();
    });
  }

  /**
   * Add tracks to collection
   * @param {*} tracks 
   */
  addTracksToCollection(tracks) {
    // Add each track to collection
    for (let track of tracks) {
      this.collection.push(track);
    }
  }

  /**
   * Toggle load more button
   * @param {*} next_href 
   */
  toggleLoadMore(next_href) {
    const button = document.querySelector('.load_more');

    // Check if next_href key exists
    if (next_href) {
      button.style.display = 'flex';
    } else {
      button.style.display = 'none';
    }
  }

}

// Instantiate app
window.app = new Tracks('59e3c5f100a1624a44281833b833fed0');

// Instantiate clipboard.js
new ClipboardJS('.copy');