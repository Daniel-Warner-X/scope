import React from 'react';
import { connect } from 'react-redux';
import find from 'lodash/find';
import map from 'lodash/map';
import { CircularProgress } from 'weaveworks-ui-components';

import { getImagesForService } from '../../actions/app-actions';

const topologyWhitelist = ['services'];

function getNewImages(images, currentId) {
  // Assume that the current image is always in the list of all available images.
  // Should be a safe assumption...
  const current = find(images, i => i.ID === currentId);
  const timestamp = new Date(current.CreatedAt);
  return find(images, i => timestamp < new Date(i.CreatedAt)) || [];
}

class NodeDetailsImageStatus extends React.PureComponent {
  constructor(props, context) {
    super(props, context);

    this.handleServiceClick = this.handleServiceClick.bind(this);
  }

  componentDidMount() {
    if (this.props.serviceName) {
      this.props.getImagesForService(this.props.params.orgId, this.props.serviceName);
    }
  }

  handleServiceClick() {
    this.props.router.push(`/flux/${this.props.params.orgId}/services/${encodeURIComponent(this.props.serviceName)}`);
  }

  render() {
    const { errors, service, fetching, currentTopologyId } = this.props;

    if (currentTopologyId && !topologyWhitelist.includes(currentTopologyId)) {
      return null;
    }

    return (
      <div className="node-details-content-section image-status">
        <div className="node-details-content-section-header">
          Container Image Status
          {service &&
            <div>
              <a
                onClick={this.handleServiceClick}
                className="node-details-table-node-link">
                  View in Deploy
              </a>
            </div>
          }

        </div>
        {fetching && <CircularProgress />}
        {!fetching && errors && <p>Error: {JSON.stringify(map(errors, 'message'))}</p>}
        {!errors && !fetching && !service && 'No service images found'}
        {!errors && !fetching && service &&
          <div className="images">
            {service.map((container) => {
              const statusText = getNewImages(container.Available, container.Current.ID).length > 0
                ? <span className="new-image">New image(s) available</span>
                : 'Image up to date';

              return (
                <div key={container.Name} className="wrapper">
                  <div className="node-details-table-node-label">{container.Name}</div>
                  <div className="node-details-table-node-label">{statusText}</div>
                </div>
              );
            })}
          </div>
        }
      </div>
    );
  }
}

function mapStateToProps({ scope }, { metadata, name }) {
  const namespace = find(metadata, d => d.id === 'kubernetes_namespace');
  const serviceName = namespace ? `${namespace.value}/${name}` : null;
  return {
    fetching: scope.getIn(['serviceImages', 'fetching']),
    errors: scope.getIn(['serviceImages', 'errors']),
    currentTopologyId: scope.get('currentTopologyId'),
    service: scope.getIn(['serviceImages', serviceName]),
    serviceName
  };
}

export default connect(mapStateToProps, { getImagesForService })(NodeDetailsImageStatus);
