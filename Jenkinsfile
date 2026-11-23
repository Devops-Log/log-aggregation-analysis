pipeline {
    agent {
        label 'rootless-docker'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
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
                    docker image inspect ${DOCKERHUB_USER}/centrallog-backend:${BUILD_NUMBER}
                    docker image inspect ${DOCKERHUB_USER}/centrallog-frontend:${BUILD_NUMBER}
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
    }

    post {
        success {
            echo 'CentralLog images built and pushed successfully!'
        }

        failure {
            echo 'CentralLog pipeline failed. Check console output.'
        }
    }
}
