docker start local-cassandra || docker run --name local-cassandra \
    -e CASSANDRA_CLUSTER_NAME="LocalCluster" \
    -p 9042:9042 \
    -d \
    docker.io/cassandra