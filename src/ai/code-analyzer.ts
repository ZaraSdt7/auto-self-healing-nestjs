import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as ts from 'typescript';
import { CodeIssue } from './interface/ai.interface';

@Injectable()
export class CodeAnalyzer {
  constructor(private logger: Logger) {
    this.logger.info('CodeAnalyzer initialized');
  }

  async analyzeFile(filePath: string): Promise<CodeIssue[]> {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.Latest,
        true,
      );
      const issues: CodeIssue[] = [];

      this.checkNode(sourceFile, issues);
      if (issues.length > 0) {
        this.logger.warn(
          `Found ${issues.length} issues in ${filePath}: ${JSON.stringify(issues)}`,
        );
      } else {
        this.logger.debug(`No issues found in ${filePath}`);
      }
      return issues;
    } catch (error) {
      this.logger.error(`Failed to analyze ${filePath}`, error);
      return [];
    }
  }

  private checkNode(node: ts.Node, issues: CodeIssue[]) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && expression.text === 'eval') {
        const line =
          node.getSourceFile().getLineAndCharacterOfPosition(node.getStart())
            .line + 1;
        issues.push({ issue: 'Use of eval detected (security risk)', line });
      }
    }
    if (ts.isForStatement(node)) {
      const line =
        node.getSourceFile().getLineAndCharacterOfPosition(node.getStart())
          .line + 1;
      if (!node.initializer || !node.condition || !node.incrementor) {
        issues.push({ issue: 'Potentially infinite loop detected', line });
      }
    }
    ts.forEachChild(node, (child) => this.checkNode(child, issues));
  }
}
