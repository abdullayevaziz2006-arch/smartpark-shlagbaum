Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Auto-create Desktop shortcut if it doesn't exist
desktopPath = WshShell.SpecialFolders("Desktop")
shortcutFile = desktopPath & "\SmartPark - Ishga Tushirish.lnk"
If Not fso.FileExists(shortcutFile) Then
    On Error Resume Next
    Set oLink = WshShell.CreateShortcut(shortcutFile)
    oLink.TargetPath = "wscript.exe"
    oLink.Arguments = Chr(34) & scriptDir & "\start.vbs" & Chr(34)
    oLink.WorkingDirectory = scriptDir
    oLink.IconLocation = scriptDir & "\logo.ico"
    oLink.Save
    On Error GoTo 0
End If

' Start Backend
WshShell.CurrentDirectory = scriptDir & "\backend"
WshShell.Run Chr(34) & scriptDir & "\node.exe" & Chr(34) & " index.js", 0, false

' Start Customer App
WshShell.CurrentDirectory = scriptDir & "\customer-app"
WshShell.Run Chr(34) & scriptDir & "\node.exe" & Chr(34) & " node_modules\vite\bin\vite.js", 0, false

' Wait for port 3001 to respond, then launch browser
cmdToRun = "powershell -WindowStyle Hidden -Command " & Chr(34) & "while ($true) { try { $c = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 3001); if ($c.Connected) { $c.Close(); break; } } catch {} Start-Sleep -Milliseconds 100 }; Start-Process 'http://localhost:3001'" & Chr(34)
WshShell.Run cmdToRun, 0, false
