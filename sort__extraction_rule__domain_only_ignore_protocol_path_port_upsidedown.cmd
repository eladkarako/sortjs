@echo off

chcp 65001 2>nul >nul

call "%~sdp0index.cmd" %* "domain_only_ignore_protocol_path_port_upsidedown"