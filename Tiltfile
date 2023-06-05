load('ext://namespace', 'namespace_create', 'namespace_inject')

config.define_bool("run-cypress")
cfg = config.parse()
run_cypress = cfg.get("run-cypress", False)


development_namespace='ohs-planner-development'

namespace_create(development_namespace)

# Create external resources
k8s_yaml(namespace_inject(read_file('.development/cassandra.yaml'), development_namespace))

# Create from helm chart

chart = helm(
  './helm',
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

docker_build('ghcr.io/openhealthsuite/planner', '.')

# Watch: tell Tilt how to connect locally (optional)

k8s_resource('cassandra', labels=["services"])
k8s_resource('ohs-planner', port_forwards="4024:3024", labels=["application"],  resource_deps=['cassandra'])

# Local Client
local_resource('ohs-planner client',
  serve_dir='client',
  serve_cmd='npm run dev',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL,
  labels=["local"],
  env={
    'VITE_API_HOST': 'http://localhost:4024'
  },
  links=["http://localhost:3000"]
)


# Tests: Cypress tests
local_resource('cypress-install',
  cmd='npm ci',
  dir='test/e2e/cypress',
  auto_init=run_cypress,
  trigger_mode=TRIGGER_MODE_AUTO if run_cypress else TRIGGER_MODE_MANUAL,
  labels=["tests"]
)
local_resource('cypress-run',
  env={'CYPRESS_BASE_URL':'http://localhost:4024'},
  cmd='npm test',
  dir='test/e2e/cypress',
  resource_deps=['cypress-install', 'ohs-planner'],
  auto_init=run_cypress,
  trigger_mode=TRIGGER_MODE_AUTO if run_cypress else TRIGGER_MODE_MANUAL,
  labels=["tests"]
)
local_resource('cypress-open',
  env={'CYPRESS_BASE_URL':'http://localhost:4024'},
  serve_cmd='npm start',
  serve_dir='test/e2e/cypress',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL,
  labels=["tests"]
)
