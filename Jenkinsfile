pipeline {
    agent {
        label 'rootless-docker'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    environment {
        DOCKERHUB_USER = 'city2484'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Docker') {
            steps {
                sh '''
                    docker --version
                    docker compose version
                    docker context show
                    docker info --format '{{json .SecurityOptions}}'
                    docker ps
                '''
            }
        }

        stage('Build Backend') {
            steps {
                sh '''
                    docker build \
                      -t ${DOCKERHUB_USER}/centrallog-backend:${BUILD_NUMBER} \
                      ./backend
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    docker build \
                      -t ${DOCKERHUB_USER}/centrallog-frontend:${BUILD_NUMBER} \
                      ./frontend
                '''
            }
        }

        stage('Verify Images') {
            steps {
                sh '''
                    docker image inspect \
                      ${DOCKERHUB_USER}/centrallog-backend:${BUILD_NUMBER} \
                      --format '{{.RepoTags}}'

                    docker image inspect \
                      ${DOCKERHUB_USER}/centrallog-frontend:${BUILD_NUMBER} \
                      --format '{{.RepoTags}}'
                '''
            }
        }

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
                        set -e

                        # Use the Rootless Docker socket
                        export DOCKER_HOST="unix://${XDG_RUNTIME_DIR}/docker.sock"

                        # Keep Docker Hub credentials in a temporary directory
                        export DOCKER_CONFIG="$(mktemp -d)"

                        # Remove temporary credentials when the stage exits
                        trap 'docker logout >/dev/null 2>&1 || true; rm -rf "$DOCKER_CONFIG"' EXIT

                        # Log in securely to Docker Hub
                        printf '%s' "$DOCKER_TOKEN" | docker login \
                          --username "$DOCKER_USER" \
                          --password-stdin

                        # Push backend image
                        docker push \
                          ${DOCKERHUB_USER}/centrallog-backend:${BUILD_NUMBER}

                        # Push frontend image
                        docker push \
                          ${DOCKERHUB_USER}/centrallog-frontend:${BUILD_NUMBER}
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'CentralLog images built and pushed successfully!'
        }

        failure {
            echo 'CentralLog pipeline failed. Check console output.'
        }

        always {
            echo "Pipeline execution finished: Build #${BUILD_NUMBER}"
        }
    }
}                   
