stage('Push to Docker Hub') {
    steps {
        withCredentials([
            usernamePassword(
                credentialsId: 'docker-hub-creds',
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_TOKEN'
            )
        ]) {
            sh '''
                set +x

                export DOCKER_HOST="unix://${XDG_RUNTIME_DIR}/docker.sock"
                export DOCKER_CONFIG="$(mktemp -d)"

                trap 'docker logout >/dev/null 2>&1 || true; rm -rf "$DOCKER_CONFIG"' EXIT

                printf '%s' "$DOCKER_TOKEN" | docker login \
                  --username "$DOCKER_USER" \
                  --password-stdin

                docker push ${DOCKERHUB_USER}/centrallog-backend:${BUILD_NUMBER}
                docker push ${DOCKERHUB_USER}/centrallog-frontend:${BUILD_NUMBER}
            '''
        }
    }
}
