import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

import { TextUtil } from 'fptcore';

function renderEntrywayRelay(org, experience, scripts, updateRelays, systemActionRequestState) {
  const activeScript = _.find(scripts, { isActive: true });
  const entrywaySpecs = _.filter(_.get(activeScript, 'content.relays'), {
    entryway: true
  });
  if (!entrywaySpecs.length) {
    return (
      <div>
        { /* eslint-disable-next-line max-len */ }
        <i className="fa fa-phone" /> Runs cannot be created by text message because no entryway phone lines exist.
      </div>
    );
  }
  let hasUnallocated = false;
  const renderedEntryways = entrywaySpecs.map((entryway) => {
    const relay = _.find(experience.relays, {
      forRoleName: entryway.for,
      asRoleName: entryway.as || entryway.for,
      withRoleName: entryway.with,
      participantPhoneNumber: ''
    });
    if (!relay) {
      hasUnallocated = true;
    }
    const forRole = _.find(activeScript.content.roles,
      { name: entryway.for });
    return (
      <span key={entryway.name}>
        {forRole.title} {relay ? `at ${formatPhoneNumberIntl(relay.relayPhoneNumber)}` : ''}
      </span>
    );
  });

  const allocateRelaysBtn = hasUnallocated ? (
    <button
      disabled={systemActionRequestState === 'pending'}
      className="btn btn-sm btn-primary ml-2"
      onClick={() => updateRelays(
        org.id, experience.id)}>
      Assign number
    </button>
  ) : null;

  return (
    <div>
      <i className="fa fa-phone" /> Runs can be created by call or texts: {renderedEntryways}
      {allocateRelaysBtn}
    </div>
  );
}

function renderEntrywayWebpage(org, experience, scripts) {
  const activeScript = _.find(scripts, { isActive: true });
  const entrywayInterfaces = _.filter(activeScript.content.interfaces,
    { entryway: true });
  if (!entrywayInterfaces.length) {
    return (
      <div>
        <i className="fa fa-file mr-1" />
        Runs cannot be created over the web because no entryway interfaces exist.
      </div>
    );
  }
  const baseUrl =
    `${window.location.origin}/entry/${org.name}/` +
    `${experience.name}`;
  const multipleInterfaces = entrywayInterfaces.length > 1;
  return entrywayInterfaces.map((i) => {
    const url = multipleInterfaces ?
      `${baseUrl}/${TextUtil.dashVarForText(i.title)}` :
      baseUrl;
    return (
      <div key={i.name}>
        <i className="fa fa-file mr-1" />
        Runs can be created at
        <a
          className="ml-1"
          href={url}
          target="_blank"
          rel="noopener noreferrer">
          {url}
        </a>
      </div>
    );
  });
}

function renderEntrywayNote(org, experience, scripts, updateRelays, systemActionRequestState) {
  const activeScript = _.find(scripts, { isActive: true });
  if (!activeScript) {
    return null;
  }
  return (
    <div className="alert alert-secondary">
      {renderEntrywayRelay(org, experience, scripts, updateRelays, systemActionRequestState)}
      {renderEntrywayWebpage(org, experience, scripts)}
    </div>
  );
}

export default function MonthIndex({ match, org, experience, scripts, updateRelays,
  systemActionRequestState }) {
  const d = moment(`${match.params.year}-${match.params.month}-01`, 'YYYY-MM-DD');
  return (
    <div>
      {renderEntrywayNote(org, experience, scripts, updateRelays, systemActionRequestState)}
      <Link
        className="btn btn-block btn-primary"
        to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${match.params.year}/${match.params.month}?group=new`}>
        Schedule a run group in {d.format('MMMM YYYY')}
      </Link>
    </div>
  );
}

MonthIndex.propTypes = {
  match: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  scripts: PropTypes.array.isRequired,
  updateRelays: PropTypes.func.isRequired,
  systemActionRequestState: PropTypes.string
};

MonthIndex.defaultProps = {
  systemActionRequestState: null
};
