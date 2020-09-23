@echo off

chcp 65001 2>nul >nul

call "%~sdp0index.cmd" %* "ignore_file_extension_everything_after_first_dot"