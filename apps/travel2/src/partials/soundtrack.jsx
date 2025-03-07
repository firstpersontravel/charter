import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

export default class Soundtrack extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // eslint-disable-next-line react/no-unused-state
      currentTime: moment.utc(),
      duration: null,
      durationForUrl: null,
      hasPlayPermission: false,
      isPlaying: false
    };

    this.audioRef = React.createRef();
    this.interval = null;
  }

  componentDidMount() {
    // Initialize timer for updating current time
    this.interval = setInterval(() => {
      // eslint-disable-next-line react/no-unused-state
      this.setState({ currentTime: moment.utc() });
    }, 1000);

    // Handle initial audio URL
    this.handleAudioUrlChange();

    this.audioRef.current.addEventListener('ended', this.onAudioEnded.bind(this));
    this.audioRef.current.addEventListener('canplay', this.onAudioCanPlay.bind(this));

    if (this.props.audioState?.isPlaying) {
      this.startOrAskPermission();
    }
  }

  componentDidUpdate(prevProps) {
    // Handle audio URL changes
    if (prevProps.audioState?.url !== this.props.audioState?.url) {
      this.handleAudioUrlChange();
    }
    if (prevProps.audioState?.isPlaying !== this.props.audioState?.isPlaying) {
      if (this.props.audioState?.isPlaying) {
        this.startOrAskPermission();
      } else {
        this.stopPlaying();
      }
    }
  }

  componentWillUnmount() {
    // Clean up interval
    clearInterval(this.interval);

    this.audioRef.current.removeEventListener('ended');
    this.audioRef.current.removeEventListener('canplay');
  }

  onAudioEnded = () => {
    this.setState({ isPlaying: false });
    this.audioRef.current.src = '';
  }

  onAudioCanPlay = () => {
    if (!this.state.isPlaying) {
      this.startOrAskPermission();
    }
  }

  handleAudioUrlChange = () => {
    if (!this.props.audioState?.url) {
      this.setState({
        duration: null,
        durationForUrl: null
      });
      return;
    }

    const audioUrl = this.props.audioState.url;
    if (this.state.durationForUrl !== audioUrl) {
      this.audioRef.current.addEventListener('loadedmetadata', () => {
        this.setState({
          duration: this.audioRef.current.duration,
          durationForUrl: audioUrl
        });
      });
      this.audioRef.current.src = audioUrl;
      this.audioRef.current.load();
      // If already ready, play now
      if (this.audioRef.current.readyState >= this.audioRef.current.HAVE_FUTURE_DATA) {
        this.startOrAskPermission();
      }
    }
  }

  // Audio playback functions
  startOrAskPermission = () => {
    if (!this.props.audioState?.isPlaying) return;

    if (!this.audioRef.current) return;

    if (this.state.hasPlayPermission) {
      this.startPlaying();
    } else {
      // eslint-disable-next-line no-undef
      swal({ title: 'Please tap to continue' }, () => {
        this.setState({ hasPlayPermission: true });
        this.startPlaying();
      });
    }
  }

  startPlaying = () => {
    const time = this.audioTime();
    if (!this.audioRef.current) return;

    if (time && time > 0) {
      this.audioRef.current.currentTime = time;
      // Don't start audio if we're later than the duration
      if (this.state.duration && time > this.state.duration) {
        return;
      }
    }
    this.audioRef.current.play()
      .then(() => {
        this.setState({ isPlaying: true });
      })
      .catch((err) => {
        console.error('Error playing audio:', err);
      });
  }

  stopPlaying = () => {
    if (!this.state.isPlaying || !this.audioRef.current) return;

    this.setState({ isPlaying: false });
    this.audioRef.current.pause();
  }

  // Computed properties
  audioTime = () => {
    const hasAudio = !!this.props.audioState?.url;
    if (!hasAudio) return 0;

    if (!this.props.audioState?.isPlaying) {
      return (this.props.audioState?.pausedTime || 0).toFixed(1);
    }

    const startedAt = this.props.audioState?.startedAt;
    const startedTime = this.props.audioState?.startedTime;
    const elapsedMsec = moment.utc().diff(startedAt);
    const currentTime = startedTime + elapsedMsec / 1000.0;
    return currentTime;
  }

  formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds - mins * 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  renderContent(hasAudio, audioTitle, audioIsLoading, audioIsPlaying, audioHasEnded, audioElapsed) {
    if (!hasAudio) {
      return 'Nothing playing';
    }

    return (
      <>
        <i className="fa fa-music" />
        {audioTitle}
&nbsp;&bull;&nbsp;
        {this.renderAudioStatus(audioIsLoading, audioIsPlaying, audioHasEnded, audioElapsed)}
      </>
    );
  }

  renderAudioStatus(audioIsLoading, audioIsPlaying, audioHasEnded, audioElapsed) {
    if (audioIsLoading) {
      return 'Loading';
    }

    if (!audioIsPlaying) {
      return 'Paused';
    }

    if (audioHasEnded) {
      return 'Ended';
    }

    if (!this.state.hasPlayPermission) {
      return <span onClick={this.startOrAskPermission}>Requesting permission...</span>;
    }

    return audioElapsed;
  }

  render() {
    const { audioState } = this.props;
    const { duration } = this.state;

    // Computed properties
    const hasAudio = !!audioState?.url;
    const audioIsLoading = !duration;
    const audioHasEnded = hasAudio && duration && this.audioTime() > duration;
    const audioElapsed = this.formatTime(this.audioTime());
    const audioTitle = audioState?.title || 'Soundtrack';
    const audioIsPlaying = !!audioState?.isPlaying;

    return (
      <div className={`trip-soundtrack ${hasAudio ? 'active' : 'inactive'}`}>
        <audio ref={this.audioRef} style={{ display: 'none' }} />
        {this.renderContent(hasAudio, audioTitle, audioIsLoading, audioIsPlaying,
          audioHasEnded, audioElapsed)}
      </div>
    );
  }
}

Soundtrack.propTypes = {
  audioState: PropTypes.object
};

Soundtrack.defaultProps = {
  audioState: null
};
