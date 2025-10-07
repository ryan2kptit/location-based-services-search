# Scaling Strategy

## Ongoing Situation
- **1 backend container** → bottleneck
- **1 MySQL** → no replication
- **Rate limit**: 50-100 req/min

## 🚀 Scaling to millions requests

### Phase 1: Quick Wins
- Database indexes + query optimization
- Redis caching strategy
- Connection pooling
- Increasing rate limits

### Phase 2: Horizontal Scaling
- Nginx load balancer
- Scale to 3 backend instances
- MySQL read replicas (1 primary + 2 replicas)
- Redis cluster

### Phase 3: Advanced
- CDN (CloudFlare/CloudFront)
- Elasticsearch
- Redis GEO cho spatial caching
- Database sharding

### Phase 4: Enterprise 
- Using Gcloud services to deploy and auto-scaling.




