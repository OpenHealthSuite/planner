load('ext://namespace', 'namespace_create', 'namespace_inject')

development_namespace='ohs-planner-development'

namespace_create(development_namespace)

# Create external resources
k8s_yaml(namespace_inject(read_file('.development/cassandra.yaml'), development_namespace))

# Create from helm chart

chart = helm(
  './helm/ohs-planner',
  name='ohs-planner-development',
  namespace=development_namespace,
  # values=['./path/to/chart/dir/values-dev.yaml'],
  set=[
    'cassandra.contactpoints=cassandra:9042',
    'replicas=1',
    'singleuserid=tilt-test-user-id'
  ]
)

k8s_yaml(chart)


# Build: tell Tilt what images to build from which directories

docker_build('ghcr.io/openhealthsuite/planner', '.', dockerfile='Containerfile')

# Watch: tell Tilt how to connect locally (optional)

k8s_resource('ohs-planner', port_forwards="4024:3024", labels=["application"])
