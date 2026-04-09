import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'login_page.dart';
import 'register_page.dart';

class LandingPage extends StatelessWidget {
  const LandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginPage()),
                      );
                    },
                    child: const Text(
                      'Log In',
                      style: TextStyle(color: AppTheme.whiteText),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.dark2,
                      foregroundColor: AppTheme.whiteText,
                      minimumSize: const Size(90, 40),
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const RegisterPage()),
                      );
                    },
                    child: const Text('Sign Up'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final mobile = constraints.maxWidth < 700;

                    if (mobile) {
                      return SingleChildScrollView(
                        child: Column(
                          children: const [
                            SizedBox(height: 60),
                            _HeroTitle(),
                            SizedBox(height: 40),
                            _BookStack(),
                          ],
                        ),
                      );
                    }

                    return Row(
                      children: const [
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: _HeroTitle(),
                          ),
                        ),
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: _BookStack(),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroTitle extends StatelessWidget {
  const _HeroTitle();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'Welcome to the Book Club',
      style: TextStyle(
        color: AppTheme.whiteText,
        fontSize: 54,
        fontWeight: FontWeight.w800,
        height: 1.05,
        fontFamily: 'Georgia'
        
      ),
    );
  }
}

class _BookStack extends StatelessWidget {
  const _BookStack();

  @override
  Widget build(BuildContext context) {
    Widget book(String assetOrUrl, {double height = 260, double dx = 0}) {
      return Transform.translate(
        offset: Offset(dx, 0),
        child: Container(
          height: height,
          width: 170,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Colors.black38,
                blurRadius: 12,
                offset: Offset(6, 6),
              )
            ],
            image: DecorationImage(
              image: NetworkImage(assetOrUrl),
              fit: BoxFit.cover,
            ),
          ),
        ),
      );
    }

    return SizedBox(
      height: 320,
      width: 360,
      child: Stack(
        alignment: Alignment.centerRight,
        children: [
          Positioned(right: 0, child: book('https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', height: 220)),
          Positioned(right: 70, child: book('https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', height: 240)),
          Positioned(right: 140, child: book('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400', height: 260)),
        ],
      ),
    );
  }
}