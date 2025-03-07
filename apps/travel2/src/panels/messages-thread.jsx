import React from 'react';
import PropTypes from 'prop-types';

export default class MessagesThreadPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messageInput: '',
      isSendingMessage: false,
      displayCount: 10
    };

    this.messagesContainerRef = React.createRef();
    this.displayIncrease = 10;

    // Bind methods
    this.handleSendText = this.handleSendText.bind(this);
    this.handleShowEarlier = this.handleShowEarlier.bind(this);
    this.renderMessageItem = this.renderMessageItem.bind(this);
    this.renderEarlierMessagesButton = this.renderEarlierMessagesButton.bind(this);
    this.renderSendingIndicator = this.renderSendingIndicator.bind(this);
    this.renderMessageForm = this.renderMessageForm.bind(this);
    this.renderRecentMessages = this.renderRecentMessages.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    // Scroll to bottom when messages change
    if (this.messagesContainerRef.current) {
      this.messagesContainerRef.current.scrollTop = this.messagesContainerRef.current.scrollHeight;
    }
  }

  // Handle sending text messages
  handleSendText() {
    if (!this.state.messageInput || this.state.messageInput === '') return;

    const player = this.props.evaluator.getPlayer();
    const asRoleName = this.props.panel.as || player.roleName;
    const withRoleName = this.props.panel.with;

    this.props.postAction('send_text', {
      from_role_name: asRoleName,
      to_role_name: withRoleName,
      content: this.state.messageInput
    });
    this.setState({ messageInput: '' });
  }

  // Handle showing earlier messages
  handleShowEarlier() {
    this.setState(prevState => ({
      displayCount: prevState.displayCount + this.displayIncrease
    }));
  }


  // Render message item
  renderMessageItem(message) {
    const { evaluator, panel } = this.props;
    const player = evaluator.getPlayer();
    const asRoleName = panel.as || player.roleName;

    const isOutgoing = message.fromRoleName === asRoleName;
    const messageClass = `messages-item messages-item-${isOutgoing ? 'outgoing' : 'incoming'} messages-item-${message.medium}`;
    const createdAtLocal = new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    let content;
    if (message.medium === 'text') {
      content = evaluator.humanizeText(message.content);
    } else if (message.medium === 'image') {
      content = <img src={message.content} alt="Message" />;
    } else if (message.medium === 'audio') {
      content = <audio src={message.content} controls />;
    } else {
      content = '';
    }

    return (
      <div key={message.id} className={messageClass}>
        <div className="timestamp">{createdAtLocal}</div>
        <div className="msg">
          {typeof content === 'string' ? <span dangerouslySetInnerHTML={{ __html: content }} /> : content}
        </div>
      </div>
    );
  }

  renderRecentMessages(messages) {
    return messages.map(message => this.renderMessageItem(message));
  }

  // Render earlier messages button
  renderEarlierMessagesButton(numEarlierMessages) {
    if (numEarlierMessages <= 0) {
      return null;
    }

    return (
      <p className="earlier-messages">
        <button className="pure-button" onClick={this.handleShowEarlier}>
          Show
          {' '}
          {numEarlierMessages}
          {' '}
          earlier messages
        </button>
      </p>
    );
  }

  // Render sending indicator
  renderSendingIndicator() {
    if (!this.state.isSendingMessage) {
      return null;
    }

    return (
      <div className="messages-item messages-item-outgoing messages-item-text">
        <div className="msg">Sending...</div>
      </div>
    );
  }

  // Render message form
  renderMessageForm(placeholder) {
    return (
      <div className="message-send">
        <form encType="multipart/form-data" className="pure-g">
          <input
            className="pure-u-5-6 message-input"
            value={this.state.messageInput}
            onChange={e => this.setState({ messageInput: e.target.value })}
            onKeyPress={e => e.key === 'Enter' && this.handleSendText()}
            placeholder={placeholder} />

          <button
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            className="pure-button pure-button-primary pure-u-1-6"
            onClick={(e) => { e.preventDefault(); this.handleSendText(); }}>
            Send
          </button>
        </form>
      </div>
    );
  }

  render() {
    const { evaluator, panel } = this.props;
    const { displayCount } = this.state;

    // Get the player and role information
    const player = evaluator.getPlayer();
    const asRoleName = panel.as || player.roleName;
    const withRoleName = panel.with;

    // Get the players
    const withPlayer = evaluator.getPlayerByRoleName(withRoleName);
    const withRole = this.props.evaluator.getScriptContent().roles
      .find(r => r.name === withRoleName);

    // Get the display name for the contact
    const withName = (withPlayer && (withPlayer.contactName || withPlayer.firstName))
      || (withRole && withRole.title)
      || 'Unnamed';

    // Get all messages between these players
    const messages = evaluator.getMessages(asRoleName, withRoleName)
      .sort((a, b) => a.createdAt - b.createdAt);

    // Calculate number of earlier messages
    const numEarlierMessages = Math.max(0, messages.length - displayCount);

    // Get recent messages based on display count
    const recentMessages = messages.slice(Math.max(0, messages.length - displayCount));

    // Placeholder text for message input
    const placeholder = `Compose message to ${withName}`;

    return (
      <div className="page-panel-messages" ref={this.messagesContainerRef}>
        <h1>
          You &amp;
          {withName}
        </h1>
        {this.renderEarlierMessagesButton(numEarlierMessages)}
        {this.renderRecentMessages(recentMessages)}
        {this.renderSendingIndicator()}
        {this.renderMessageForm(placeholder)}
      </div>
    );
  }
}

MessagesThreadPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired
};
