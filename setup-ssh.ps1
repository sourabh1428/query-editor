# Create .ssh directory if it doesn't exist
$sshPath = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshPath)) {
    New-Item -ItemType Directory -Path $sshPath | Out-Null
    Write-Host "Created .ssh directory at $sshPath"
}

# Set proper permissions on .ssh directory
try {
    $acl = Get-Acl $sshPath
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "$env:USERDOMAIN\$env:USERNAME",
        "FullControl",
        "ContainerInherit,ObjectInherit",
        "None",
        "Allow"
    )
    $acl.AddAccessRule($rule)
    Set-Acl $sshPath $acl
    Write-Host "Set permissions on .ssh directory"
} catch {
    Write-Error "Failed to set permissions on .ssh directory: $_"
    exit 1
}

# Create the EC2 key file
$keyPath = "$sshPath\ec2.pem"
@"
-----BEGIN RSA PRIVATE KEY-----
[Your EC2 private key content here]
-----END RSA PRIVATE KEY-----
"@ | Out-File -FilePath $keyPath -Encoding ascii

# Set restrictive permissions on the key file
$acl = Get-Acl $keyPath
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "$env:USERDOMAIN\$env:USERNAME",
    "Read,Write",
    "None",
    "None",
    "Allow"
)
$acl.AddAccessRule($rule)
Set-Acl $keyPath $acl

# Define the EC2 hostname
$ec2Hostname = "ec2-15-206-178-18.ap-south-1.compute.amazonaws.com"

# Create SSH config file
$configPath = "$sshPath\config"
@"
Host $ec2Hostname
    User ubuntu
    IdentityFile ~/.ssh/ec2.pem
    StrictHostKeyChecking accept-new
"@ | Out-File -FilePath $configPath -Encoding ascii -Force
Write-Host "Created SSH config file"

# Set permissions on config file
try {
    $acl = Get-Acl $configPath
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "$env:USERDOMAIN\$env:USERNAME",
        "Read,Write",
        "None",
        "None",
        "Allow"
    )
    $acl.AddAccessRule($rule)
    Set-Acl $configPath $acl
    Write-Host "Set permissions on SSH config file"
} catch {
    Write-Error "Failed to set permissions on SSH config file: $_"
    exit 1
}

# Add host to known_hosts using ssh-keyscan
$knownHostsPath = "$sshPath\known_hosts"
Write-Host "Adding EC2 host key to known_hosts..."
try {
    $hostKey = ssh-keyscan -H $ec2Hostname 2>$null
    if ($hostKey) {
        $hostKey | Out-File -Append -FilePath $knownHostsPath -Encoding ascii
        Write-Host "Added host key to known_hosts"
    } else {
        Write-Error "Failed to retrieve host key"
        exit 1
    }
} catch {
    Write-Error "Failed to update known_hosts: $_"
    exit 1
}

Write-Host "`nSSH configuration completed. Testing connection..."
Write-Host "Attempting to connect to $ec2Hostname..."
ssh -v -i "$sshPath\ec2.pem" "ubuntu@$ec2Hostname" "echo 'SSH connection successful'" 