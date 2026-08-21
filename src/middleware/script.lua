
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, '-inf', now-window)

local count = redis.call('ZCARD',key)

if count<limit then
  redis.call('ZADD', key, now, member)
  redis.call('EXPIRE', key, math.ceil(window/1000))
  return {1, count+1}
end

return {0, count}

