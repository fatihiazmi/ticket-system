# Outputs for development environment

output "instance_public_ip" {
  description = "Public IP address of the development instance"
  value       = aws_eip.supabase_dev.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the development instance"
  value       = aws_instance.supabase_dev.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to the development instance"
  value       = "ssh -i ~/.ssh/your-private-key ubuntu@${aws_eip.supabase_dev.public_ip}"
}

output "supabase_urls" {
  description = "Supabase service URLs"
  value = {
    api_url    = "http://${aws_eip.supabase_dev.public_ip}:8000"
    studio_url = "http://${aws_eip.supabase_dev.public_ip}:3001"
    frontend_url = "http://${aws_eip.supabase_dev.public_ip}:3000"
  }
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.supabase_dev.id
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.supabase_dev.id
}