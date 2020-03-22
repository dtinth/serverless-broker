rsync -rv dist/ bitnami@serverless-broker-server:serverless-broker/
rsync -rv config/ bitnami@serverless-broker-server:.config/
ssh bitnami@serverless-broker-server bash -e <<'EOF'
  systemctl --user enable serverless-broker
  systemctl --user daemon-reload
  systemctl --user restart serverless-broker
EOF
