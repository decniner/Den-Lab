param([Parameter(Mandatory=$true)][string]$RunnerDirectory)
$ErrorActionPreference = 'Stop'
$runnerExecutable = Join-Path ([IO.Path]::GetFullPath($RunnerDirectory)) 'bin/Runner.Listener.exe'
if (-not (Test-Path -LiteralPath $runnerExecutable)) { throw 'Registered official runner executable is missing.' }
$taskName = 'Den Japan Explained Runner'
$service = New-Object -ComObject 'Schedule.Service'
$service.Connect()
$folder = $service.GetFolder('\')
$definition = $service.NewTask(0)
$definition.RegistrationInfo.Description = 'Registered Japan Explained GitHub runner for private 05:00 JST daily workflow'
$definition.Principal.UserId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$definition.Principal.LogonType = 3
$definition.Principal.RunLevel = 0
$definition.Settings.Enabled = $true
$definition.Settings.StartWhenAvailable = $true
$definition.Settings.ExecutionTimeLimit = 'PT0S'
$definition.Settings.MultipleInstances = 2
$definition.Settings.DisallowStartIfOnBatteries = $false
$definition.Settings.StopIfGoingOnBatteries = $false
$trigger = $definition.Triggers.Create(9)
$trigger.UserId = $definition.Principal.UserId
$action = $definition.Actions.Create(0)
$action.Path = $runnerExecutable
$action.Arguments = 'run'
$action.WorkingDirectory = [IO.Path]::GetFullPath($RunnerDirectory)
$registered = $folder.RegisterTaskDefinition($taskName,$definition,6,$definition.Principal.UserId,$null,3,$null)
$registered.Run($null) | Out-Null
Write-Output 'Current-user runner startup task installed and started. Verify online status in GitHub Settings > Actions > Runners.'
