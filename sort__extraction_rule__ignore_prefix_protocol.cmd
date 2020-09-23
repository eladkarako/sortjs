@echo off

chcp 65001 2>nul >nul

call "%~sdp0index.cmd" %* "ignore_protocol_prefix"