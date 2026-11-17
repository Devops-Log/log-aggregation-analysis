pipeline {
    agent {
        label 'rootless-docker'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
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
                    -t centrallog-backend:latest ./backend
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    docker build \
                    -t centrallog-frontend:latest ./frontend
                '''
            }
        }

        stage('Verify Images') {
            steps {
                sh 'docker images'
            }
        }
    }

    post {
        success {
            echo 'CentralLog build completed successfully!'
        }

        failure {
            echo 'CentralLog build failed. Check console output.'
        }
    }
}
