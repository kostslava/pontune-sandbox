export const LANGUAGE_CONFIG = {
  java: {
    label: 'Java',
    pistonLanguage: 'java',
    version: '15.0.2',
    files: [
      {
        name: 'Main.java',
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter your name: ");
        String name = scanner.nextLine();

        System.out.print("Enter your age: ");
        int age = scanner.nextInt();

        System.out.println("Hello " + name + "! You are " + age + " years old.");

        scanner.close();
    }
}`,
      },
    ],
  },
  cpp: {
    label: 'C++',
    pistonLanguage: 'cpp',
    version: '10.2.0',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;

    cout << "Enter your name: ";
    getline(cin, name);

    cout << "Enter your age: ";
    cin >> age;

    cout << "Hello " << name << "! You are " << age << " years old." << endl;
    return 0;
}`,
      },
    ],
  },
};

export const LANGUAGE_IDS = Object.keys(LANGUAGE_CONFIG);
