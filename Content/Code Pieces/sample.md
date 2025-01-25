# Sample Code Piece

This is a sample code piece to test the sidebar functionality.

## Code Example

```cpp
int main() {
    printf("Hello World!\n");
    return 0;
}
```

# Sample Code Piece

This is a sample code piece to test the sidebar functionality.

## Code Example

## Code Examples

Here are some code snippets demonstrating various programming concepts and techniques.

### 1. Python Decorator Example

```python
def timing_decorator(func):
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f} seconds to execute")
        return result
    return wrapper

@timing_decorator
def slow_function():
    import time
    time.sleep(1)
    return "Function completed"

# Usage
result = slow_function()  # Output: slow_function took 1.00 seconds to execute
```

### 2. JavaScript Promise Chain

```javascript
const fetchUserData = (userId) => {
  return fetch(`/api/users/${userId}`)
    .then((response) => response.json())
    .then((user) => {
      console.log("User:", user);
      return fetch(`/api/posts?userId=${user.id}`);
    })
    .then((response) => response.json())
    .then((posts) => {
      console.log("Posts:", posts);
      return { user, posts };
    })
    .catch((error) => {
      console.error("Error:", error);
      throw error;
    });
};
```

### 3. Go Concurrent Pattern

```go
func processItems(items []string) {
    results := make(chan string, len(items))
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item string) {
            defer wg.Done()
            // Process item
            result := processItem(item)
            results <- result
        }(item)
    }

    // Close results channel when all goroutines complete
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    for result := range results {
        fmt.Println(result)
    }
}
```

### 4. SQL Query Optimization

```sql
-- Before optimization
SELECT *
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending'
AND c.country = 'USA';

-- After optimization
SELECT o.id, o.order_date, c.name, c.email
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending'
AND c.country = 'USA'
INDEX HINT(orders idx_status, customers idx_country);
```

### Best Practices

1. **Code Organization**

   - Keep functions small and focused
   - Follow consistent naming conventions
   - Use meaningful variable names
   - Add appropriate comments

2. **Error Handling**

   - Always handle edge cases
   - Provide meaningful error messages
   - Log errors appropriately
   - Use try-catch blocks when necessary

3. **Performance**

   - Use appropriate data structures
   - Optimize database queries
   - Implement caching when needed
   - Consider memory usage

4. **Security**
   - Validate user input
   - Use parameterized queries
   - Implement proper authentication
   - Follow security best practices

### Testing Example

```python
import unittest

class TestStringMethods(unittest.TestCase):
    def test_upper(self):
        self.assertEqual('foo'.upper(), 'FOO')

    def test_split(self):
        s = 'hello world'
        self.assertEqual(s.split(), ['hello', 'world'])

    def test_fail(self):
        with self.assertRaises(ValueError):
            int('not a number')

if __name__ == '__main__':
    unittest.main()
```

Remember to always write clean, maintainable, and well-documented code!
